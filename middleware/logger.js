const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${req.method} ${req.originalUrl} - ${timestamp}`);
  next();
};

module.exports = logger;
