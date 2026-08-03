const validateJson = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type. Content-Type must be application/json'
      });
    }
  }
  next();
};

module.exports = validateJson;
