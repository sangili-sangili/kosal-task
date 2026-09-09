/**
 * Centralized Error Handling Middleware
 */
const { AppError } = require('../utils/errors');
const logger = require('../config/logger');

const errorMiddleware = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Handle Sequelize / Database Errors securely (Never leak SQL details to client)
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : null;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'A record with this information already exists';
    details = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : null;
  } else if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeConnectionError') {
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'A database operation failed';
    details = null; // Do not expose SQL query or parameters
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error with structured details
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - 500 Server Error: ${err.message}`, {
      stack: err.stack,
      statusCode,
      errorCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} Client Error: ${message} (${errorCode})`);
  }

  const response = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  // Only attach field validation details or debug stack when appropriate
  if (details) {
    response.error.details = details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
