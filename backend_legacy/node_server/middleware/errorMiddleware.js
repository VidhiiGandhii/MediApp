const { NODE_ENV } = require('../config/env');

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  console.log(`⚠️ 404 - Not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.url
  });
};

// Global Error Handler
const globalErrorHandler = (error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: error.message,
    stack: NODE_ENV === 'development' ? error.stack : undefined
  });
};

module.exports = { notFoundHandler, globalErrorHandler };