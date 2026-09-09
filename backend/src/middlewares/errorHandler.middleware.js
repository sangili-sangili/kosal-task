const { ApiError } = require('../errors');
const logger = require('../config/logger');
const env = require('../config/env');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatusCodes');

function errorHandler(err, req, res, next) {
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected internal server error occurred';
  let errors = null;

  // Log full error stack internally
  logger.error(`[${req.id || 'NO-REQ-ID'}] ${req.method} ${req.originalUrl} - Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = HTTP_STATUS.CONFLICT;
    errorCode = ERROR_CODES.RESOURCE_CONFLICT;
    message = 'A resource with this unique constraint already exists';
    errors = err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null;
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    errors = err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null;
  } else if (err.name === 'SequelizeDatabaseError') {
    // NEVER expose raw SQL queries or database schemas in production
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    errorCode = ERROR_CODES.DATABASE_ERROR;
    message = env.NODE_ENV === 'production' 
      ? 'A database error occurred while processing your request' 
      : `Database Error: ${err.message}`;
  }

  const responsePayload = {
    success: false,
    message,
    data: null,
    error: {
      code: errorCode,
    },
  };

  if (errors) {
    responsePayload.error.details = errors;
  }

  if (env.NODE_ENV === 'development' && !(err instanceof ApiError)) {
    responsePayload.error.debugStack = err.stack;
  }

  return res.status(statusCode).json(responsePayload);
}

module.exports = errorHandler;
