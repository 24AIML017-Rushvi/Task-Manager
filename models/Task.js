const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid priority. Allowed values: low, medium, high'
    },
    default: 'medium'
  }
});

// Pre-save hook to automatically trim whitespace from the title before saving
taskSchema.pre('save', function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Task', taskSchema);
