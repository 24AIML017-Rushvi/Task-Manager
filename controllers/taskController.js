const Task = require('../models/Task');
const { applyWorkflowRules } = require('../utils/workflowEngine');
const cache = require('../utils/cache');
const taskEventEmitter = require('../events/taskEventEmitter');

/**
 * GET /tasks
 * Return tasks based on user role and optional filter queries.
 * Normal users see their own tasks; Admins can see all tasks platform-wide.
 * Practical 9: In-Memory Caching with 60s TTL and user-specific cache keys.
 */
const getTasks = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const userId = req.user && req.user.id;
    const { status, priority, search, startDate, endDate } = req.query;

    // Build user-scoped cache key including all query parameters
    const queryString = JSON.stringify(req.query || {});
    const cacheKey = isAdmin
      ? `tasks:admin:${queryString}`
      : `tasks:user:${userId}:${queryString}`;

    // Check in-memory cache first
    const cachedTasks = cache.get(cacheKey);
    if (cachedTasks !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTasks);
    }

    const filter = {};

    // Role-based scoping
    if (!isAdmin) {
      filter.$or = [
        { user: userId },
        { user: { $exists: false } },
        { user: null }
      ];
    }

    // Status filter
    if (status === 'completed') {
      filter.completed = true;
    } else if (status === 'pending') {
      filter.completed = false;
    }

    // Priority filter
    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    // Search query across title and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      });
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const tasks = await Task.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    // Store in cache with 60s TTL
    cache.set(cacheKey, tasks, 60);

    res.set('X-Cache', 'MISS');
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/:id
 * Return one task by MongoDB document ID.
 * Practical 9: In-Memory Caching for individual task with ownership check.
 */
const getTaskById = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const taskId = req.params.id;
    const cacheKey = `task:${taskId}`;

    // Check in-memory cache for single task
    const cachedTask = cache.get(cacheKey);
    if (cachedTask !== undefined) {
      // Enforce ownership authorization on cached object
      const ownerId = cachedTask.user
        ? (cachedTask.user._id ? cachedTask.user._id.toString() : cachedTask.user.toString())
        : null;
      if (!isAdmin && ownerId && req.user && ownerId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied. You do not own this task.'
        });
      }
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTask);
    }

    const task = await Task.findById(taskId).populate('user', 'name email role');
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Authorization check
    if (!isAdmin && task.user && req.user && task.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. You do not own this task.'
      });
    }

    // Store single task in cache with 60s TTL
    cache.set(cacheKey, task, 60);

    res.set('X-Cache', 'MISS');
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks
 * Create a new task in MongoDB with validation, workflow rules, and user assignment.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority, dueDate } = req.body;

    // Server-side validation: non-empty trimmed title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Title is required and cannot be empty.'
      });
    }

    // Server-side validation: priority enum
    const allowedPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority ? String(priority).toLowerCase().trim() : 'medium';
    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({
        error: `Invalid priority '${priority}'. Allowed values are: low, medium, high.`
      });
    }

    let initialTaskData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: completed === true || completed === 'true',
      priority: taskPriority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      user: req.user ? req.user.id : undefined
    };

    // Apply active automated workflow rules
    const { updatedData, appliedRules } = await applyWorkflowRules(initialTaskData, 'on_create');

    const newTask = await Task.create(updatedData);
    const populated = await Task.findById(newTask._id).populate('user', 'name email role');

    // Practical 9: Invalidate cached task queries for this user and admin
    const taskOwnerId = req.user ? req.user.id : undefined;
    cache.invalidateUserTasks(taskOwnerId);

    // ITUE301 Practical: Background notifications using Node.js built-in EventEmitter
    const apiResponseTimestamp = new Date().toISOString();

    // Emit 'task-created' event with populated task and API timestamp
    taskEventEmitter.emit('task-created', populated, apiResponseTimestamp);

    // Return HTTP 201 immediately without awaiting the 2-second notification
    res.status(201).json({
      ...populated.toObject(),
      _appliedRules: appliedRules.length > 0 ? appliedRules : undefined,
      _apiResponseTimestamp: apiResponseTimestamp
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /tasks/:id
 * Update a task's fields in MongoDB with ownership check, workflow rules, and validation.
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority, dueDate } = req.body;
    const isAdmin = req.user && req.user.role === 'admin';

    // Ensure at least one update field was provided
    if (
      title === undefined &&
      description === undefined &&
      completed === undefined &&
      priority === undefined &&
      dueDate === undefined
    ) {
      return res.status(400).json({
        error: 'Bad Request. At least one field must be provided for update.'
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Verify task ownership or admin authorization
    if (!isAdmin && task.user && req.user && task.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to update this task.'
      });
    }

    let updates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          error: 'Title cannot be empty.'
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (completed !== undefined) {
      updates.completed = completed === true || completed === 'true';
    }

    if (priority !== undefined) {
      const allowedPriorities = ['low', 'medium', 'high'];
      const taskPriority = String(priority).toLowerCase().trim();
      if (!allowedPriorities.includes(taskPriority)) {
        return res.status(400).json({
          error: `Invalid priority '${priority}'. Allowed values are: low, medium, high.`
        });
      }
      updates.priority = taskPriority;
    }

    if (dueDate !== undefined) {
      updates.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Apply active workflow rules for on_update
    const { updatedData, appliedRules } = await applyWorkflowRules(updates, 'on_update');

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    // Practical 9: Invalidate cache for this specific task and related user/admin query lists
    const taskOwnerId = updatedTask.user
      ? (updatedTask.user._id ? updatedTask.user._id.toString() : updatedTask.user.toString())
      : undefined;
    cache.invalidateTask(req.params.id, taskOwnerId);

    res.status(200).json({
      ...updatedTask.toObject(),
      _appliedRules: appliedRules.length > 0 ? appliedRules : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
 * Delete a task from MongoDB with ownership or admin check.
 */
const deleteTask = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // Verify task ownership or admin authorization
    if (!isAdmin && task.user && req.user && task.user.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to delete this task.'
      });
    }

    const taskOwnerId = task.user ? task.user.toString() : undefined;
    await Task.findByIdAndDelete(req.params.id);

    // Practical 9: Invalidate cache for deleted task and related user/admin query lists
    cache.invalidateTask(req.params.id, taskOwnerId);

    res.status(200).json({
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/reports
 * Admin-only endpoint returning filtered task analytics and report data by date range.
 */
const getTaskReports = async (req, res, next) => {
  try {
    // Strictly enforce admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden. Admin privileges required to view task reports.'
      });
    }

    const { startDate, endDate, priority, status } = req.query;

    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Status filter
    if (status === 'completed') {
      filter.completed = true;
    } else if (status === 'pending') {
      filter.completed = false;
    }

    // Priority filter
    if (priority && ['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      filter.priority = priority.toLowerCase();
    }

    const tasks = await Task.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const priorityBreakdown = {
      low: tasks.filter((t) => t.priority === 'low').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      high: tasks.filter((t) => t.priority === 'high').length
    };

    // User aggregation
    const userBreakdownMap = {};
    tasks.forEach((t) => {
      const userKey = t.user ? (t.user.name || t.user.email) : 'Unassigned';
      userBreakdownMap[userKey] = (userBreakdownMap[userKey] || 0) + 1;
    });

    res.status(200).json({
      timeRange: {
        startDate: startDate || 'Beginning',
        endDate: endDate || 'Today'
      },
      summary: {
        total,
        completed,
        pending,
        completionRate: `${completionRate}%`
      },
      priorityBreakdown,
      userBreakdown: userBreakdownMap,
      tasks
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/cache/stats
 * Protected debug endpoint to display live cache statistics (hit/miss counts, ratios, active keys).
 * Practical 9 supplementary requirement.
 */
const getCacheStats = (req, res) => {
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    message: 'Task Cache Statistics',
    stats
  });
};

/**
 * POST /tasks/test-error-event
 * Protected test endpoint to safely trigger and verify EventEmitter error handling without crashing the server.
 */
const testNotificationError = (req, res) => {
  const simulatedTask = {
    title: req.body.title || 'Simulated Error Test Task',
    user: req.user ? { name: req.user.name, email: req.user.email } : null
  };
  const errorMessage = req.body.message || 'Simulated background notification service failure for error testing';
  const err = new Error(errorMessage);

  // Emit the error event on taskEventEmitter
  taskEventEmitter.emit('error', err, simulatedTask);

  res.status(200).json({
    success: true,
    message: 'Simulated notification error event dispatched and caught safely by EventEmitter error listener.',
    errorDetails: {
      message: err.message,
      simulatedTaskTitle: simulatedTask.title
    },
    serverStatus: 'Active & healthy (No process crash)'
  });
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskReports,
  getCacheStats,
  testNotificationError
};
