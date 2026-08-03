const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const validateTaskId = require('../middleware/validateTaskId');

// Routes for base tasks path: GET /tasks, POST /tasks
router.route('/')
  .get(taskController.getTasks)
  .post(taskController.createTask);

// Routes for individual tasks: GET /tasks/:id, PUT /tasks/:id, DELETE /tasks/:id
// validateTaskId middleware is applied globally for all methods on this path pattern
router.route('/:id')
  .all(validateTaskId)
  .get(taskController.getTaskById)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
