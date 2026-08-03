// In-memory database of tasks
let tasks = [
  { id: 1, title: 'Complete Practical 4', completed: false }
];

// Helper to generate the next auto-incrementing ID
let nextId = 2;

/**
 * GET /tasks
 * Return all tasks.
 */
const getTasks = (req, res) => {
  res.status(200).json(tasks);
};

/**
 * GET /tasks/:id
 * Return one task by ID.
 */
const getTaskById = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }
  res.status(200).json(task);
};

/**
 * POST /tasks
 * Create a new task.
 */
const createTask = (req, res) => {
  const { title } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request. Title is required and must be a non-empty string.'
    });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
};

/**
 * PUT /tasks/:id
 * Update a task's title and/or completed status.
 */
const updateTask = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  const { title, completed } = req.body;

  // Validate incoming fields if they are provided
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request. Title must be a non-empty string.'
    });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request. Completed must be a boolean.'
    });
  }

  // Ensure at least one update parameter was provided
  if (title === undefined && completed === undefined) {
    return res.status(400).json({
      error: 'Bad Request. At least one field (title or completed) must be provided for update.'
    });
  }

  // Update properties
  if (title !== undefined) {
    tasks[taskIndex].title = title.trim();
  }
  if (completed !== undefined) {
    tasks[taskIndex].completed = completed;
  }

  res.status(200).json(tasks[taskIndex]);
};

/**
 * DELETE /tasks/:id
 * Delete a task.
 */
const deleteTask = (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  tasks.splice(taskIndex, 1);
  res.status(200).json({
    message: 'Task deleted successfully'
  });
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
