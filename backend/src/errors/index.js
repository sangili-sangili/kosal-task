const ApiError = require('./ApiError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatusCodes');

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', errors = null) {
    super(HTTP_STATUS.BAD_REQUEST, message, ERROR_CODES.VALIDATION_ERROR, errors);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized access', errors = null) {
    super(HTTP_STATUS.UNAUTHORIZED, message, ERROR_CODES.AUTHENTICATION_ERROR, errors);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden access: Insufficient permissions', errors = null) {
    super(HTTP_STATUS.FORBIDDEN, message, ERROR_CODES.AUTHORIZATION_ERROR, errors);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', errors = null) {
    super(HTTP_STATUS.NOT_FOUND, message, ERROR_CODES.RESOURCE_NOT_FOUND, errors);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', errors = null) {
    super(HTTP_STATUS.CONFLICT, message, ERROR_CODES.RESOURCE_CONFLICT, errors);
  }
}

class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', errors = null) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, ERROR_CODES.INTERNAL_SERVER_ERROR, errors);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
