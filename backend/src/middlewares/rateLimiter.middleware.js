const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatusCodes');

// Standard API Rate Limiter (e.g. 100 requests per 15 minutes)
const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

// Stricter Auth Rate Limiter (e.g. 10 requests per 15 minutes to prevent brute force)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    data: null,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
};
