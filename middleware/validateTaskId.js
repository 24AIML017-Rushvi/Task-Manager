const mongoose = require('mongoose');

/**
 * Route middleware to validate MongoDB ObjectId format
 */
const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Bad Request. Invalid Task ID format.'
    });
  }
  next();
};

module.exports = validateTaskId;
