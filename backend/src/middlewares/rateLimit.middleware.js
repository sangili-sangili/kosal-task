/**
 * Rate Limiting Middleware
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 10000 : (env.RATE_LIMIT_MAX || 1000),
  skip: (req) => env.NODE_ENV === 'development' || req.ip === '127.0.0.1' || req.ip === '::1',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

module.exports = rateLimitMiddleware;
