const Task = require('../models/Task');

/**
 * GET /tasks
 * Return all tasks from MongoDB.
 */
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/:id
 * Return one task by MongoDB document ID.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks
 * Create a new task in MongoDB.
 */
const createTask = async (req, res, next) => {
  try {
    const newTask = await Task.create(req.body);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /tasks/:id
 * Update a task's fields in MongoDB.
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    // Ensure at least one update field was provided
    if (
      title === undefined &&
      description === undefined &&
      completed === undefined &&
      priority === undefined
    ) {
      return res.status(400).json({
        error: 'Bad Request. At least one field must be provided for update.'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
 * Delete a task from MongoDB.
 */
const deleteTask = async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    res.status(200).json({
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
