const WorkflowRule = require('../models/WorkflowRule');

/**
 * Evaluates and applies active workflow rules to a task object.
 * @param {Object} taskData - Data payload for creating or updating a task
 * @param {string} trigger - 'on_create' or 'on_update'
 * @returns {Promise<{ updatedData: Object, appliedRules: Array<string> }>}
 */
async function applyWorkflowRules(taskData, trigger = 'on_create') {
  const updatedData = { ...taskData };
  const appliedRules = [];

  try {
    const rules = await WorkflowRule.find({ active: true, trigger });

    for (const rule of rules) {
      let isMatch = false;

      const fieldValue = updatedData[rule.conditionField];

      if (fieldValue !== undefined && fieldValue !== null) {
        const strFieldValue = String(fieldValue).toLowerCase().trim();
        const strConditionVal = String(rule.conditionValue).toLowerCase().trim();

        if (rule.conditionOperator === 'equals') {
          isMatch = strFieldValue === strConditionVal;
        } else if (rule.conditionOperator === 'contains') {
          isMatch = strFieldValue.includes(strConditionVal);
        }
      }

      if (isMatch) {
        // Execute rule action
        if (rule.actionType === 'set_priority') {
          const allowed = ['low', 'medium', 'high'];
          if (allowed.includes(rule.actionValue.toLowerCase())) {
            updatedData.priority = rule.actionValue.toLowerCase();
            appliedRules.push(`${rule.name}: Set priority to ${rule.actionValue}`);
          }
        } else if (rule.actionType === 'set_due_days') {
          const days = parseInt(rule.actionValue, 10);
          if (!isNaN(days) && !updatedData.dueDate) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);
            updatedData.dueDate = dueDate;
            appliedRules.push(`${rule.name}: Auto-assigned due date to ${days} days from now`);
          }
        } else if (rule.actionType === 'mark_completed') {
          updatedData.completed = rule.actionValue === 'true';
          appliedRules.push(`${rule.name}: Set completed to ${rule.actionValue}`);
        }
      }
    }
  } catch (err) {
    console.error('Workflow rule evaluation warning:', err.message);
  }

  return { updatedData, appliedRules };
}

module.exports = { applyWorkflowRules };
