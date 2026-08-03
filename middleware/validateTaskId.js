const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  const idRegex = /^\d+$/;
  if (!idRegex.test(id)) {
    return res.status(400).json({
      error: 'Bad Request. Invalid Task ID format.'
    });
  }
  next();
};

module.exports = validateTaskId;
