/**
 * Global Error Handler Middleware
 * Formats Mongoose and server errors cleanly without exposing raw internal details.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // Mongoose Validation Error (e.g. missing title, invalid priority enum)
  if (err.name === 'ValidationError') {
    const details = {};
    for (const field in err.errors) {
      details[field] = err.errors[field].message;
    }
    return res.status(400).json({
      error: 'Validation failed',
      details
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request. Invalid ID format.'
    });
  }

  // Generic internal server error
  res.status(500).json({
    error: 'Something went wrong'
  });
};

module.exports = errorHandler;
