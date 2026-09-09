/**
 * Rate Limiting Middleware
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const rateLimitMiddleware = rateLimit({
  windowMs: env.SECURITY?.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.SECURITY?.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
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
