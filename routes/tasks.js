const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const validateTaskId = require('../middleware/validateTaskId');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Protect all /tasks routes with JWT authentication middleware
router.use(authenticate);

// Admin-only date-range reports route (must be defined before /:id)
router.get('/reports', requireAdmin, taskController.getTaskReports);

// Protected debug endpoint to display live cache statistics (Practical 9)
router.get('/cache/stats', taskController.getCacheStats);

// Protected debug endpoint to test notification error handling without crashing (ITUE301)
router.post('/test-error-event', taskController.testNotificationError);

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
