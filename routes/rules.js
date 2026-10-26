const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowRuleController');
const { authenticate } = require('../middleware/auth');

// All workflow rules routes require authentication
router.use(authenticate);

router.route('/')
  .get(workflowController.getRules)
  .post(workflowController.createRule);

router.route('/:id')
  .put(workflowController.updateRule)
  .delete(workflowController.deleteRule);

module.exports = router;
