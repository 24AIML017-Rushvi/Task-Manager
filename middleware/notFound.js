const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route Not Found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
};

module.exports = notFound;
