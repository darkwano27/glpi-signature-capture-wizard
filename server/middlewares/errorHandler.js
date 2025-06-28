const logger = {
  info: (...args) => console.log('info:', ...args),
  error: (...args) => console.error('error:', ...args)
};

function errorHandler(err, req, res, next) {
  logger.error(err.stack || err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: 'Not found' });
}

module.exports = { logger, errorHandler, notFoundHandler };