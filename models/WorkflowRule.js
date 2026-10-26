const mongoose = require('mongoose');

const workflowRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  trigger: {
    type: String,
    enum: ['on_create', 'on_update'],
    default: 'on_create'
  },
  conditionField: {
    type: String,
    enum: ['priority', 'title', 'completed'],
    required: [true, 'Condition field is required']
  },
  conditionOperator: {
    type: String,
    enum: ['equals', 'contains'],
    default: 'equals'
  },
  conditionValue: {
    type: String,
    required: [true, 'Condition value is required'],
    trim: true
  },
  actionType: {
    type: String,
    enum: ['set_priority', 'set_due_days', 'mark_completed'],
    required: [true, 'Action type is required']
  },
  actionValue: {
    type: String,
    required: [true, 'Action value is required'],
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorkflowRule', workflowRuleSchema);
