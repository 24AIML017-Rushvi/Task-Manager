const WorkflowRule = require('../models/WorkflowRule');

/**
 * Seed default demonstration workflow rules if none exist.
 */
async function seedDefaultRules() {
  try {
    const count = await WorkflowRule.countDocuments();
    if (count === 0) {
      await WorkflowRule.create([
        {
          name: 'Urgent Task Escalation',
          description: 'Automatically sets task priority to High when "[urgent]" is in the title.',
          trigger: 'on_create',
          conditionField: 'title',
          conditionOperator: 'contains',
          conditionValue: '[urgent]',
          actionType: 'set_priority',
          actionValue: 'high',
          active: true
        },
        {
          name: 'High Priority Due Window',
          description: 'Auto-assigns a due date 2 days in advance for High priority tasks if none provided.',
          trigger: 'on_create',
          conditionField: 'priority',
          conditionOperator: 'equals',
          conditionValue: 'high',
          actionType: 'set_due_days',
          actionValue: '2',
          active: true
        }
      ]);
      console.log('Seeded default workflow automation rules.');
    }
  } catch (err) {
    console.error('Workflow rules seeding notice:', err.message);
  }
}

/**
 * GET /rules - Fetch all workflow rules
 */
const getRules = async (req, res, next) => {
  try {
    const rules = await WorkflowRule.find().sort({ createdAt: -1 });
    res.status(200).json(rules);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /rules - Create a new workflow rule
 */
const createRule = async (req, res, next) => {
  try {
    const {
      name,
      description,
      trigger,
      conditionField,
      conditionOperator,
      conditionValue,
      actionType,
      actionValue,
      active
    } = req.body;

    if (!name || !conditionField || !conditionValue || !actionType || !actionValue) {
      return res.status(400).json({
        error: 'Please provide all required fields: name, conditionField, conditionValue, actionType, actionValue.'
      });
    }

    const newRule = await WorkflowRule.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      trigger: trigger || 'on_create',
      conditionField,
      conditionOperator: conditionOperator || 'equals',
      conditionValue: conditionValue.trim(),
      actionType,
      actionValue: actionValue.trim(),
      active: active !== undefined ? Boolean(active) : true
    });

    res.status(201).json(newRule);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /rules/:id - Update an existing workflow rule
 */
const updateRule = async (req, res, next) => {
  try {
    const updated = await WorkflowRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Workflow rule not found.' });
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /rules/:id - Delete a workflow rule
 */
const deleteRule = async (req, res, next) => {
  try {
    const deleted = await WorkflowRule.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow rule not found.' });
    }
    res.status(200).json({ message: 'Workflow rule deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  seedDefaultRules
};
