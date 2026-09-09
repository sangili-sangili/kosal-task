const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('./errors');

/**
 * Signs and issues an access JWT
 * @param {Object} payload - Token claims (e.g. { id, email, role })
 * @param {string} expiresIn - Optional expiration time string (e.g. '15m')
 * @returns {string} Signed JWT string
 */
function generateAccessToken(payload, expiresIn = env.JWT.ACCESS_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
    expiresIn,
  });
}

/**
 * Synchronously or asynchronously verifies a JWT
 * @param {string} token - Raw JWT string
 * @returns {Object} Decoded payload
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT.ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Authentication token has expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid authentication token', 'INVALID_TOKEN');
  }
}

/**
 * Decodes a token without signature verification (useful for inspect/expiry checks)
 * @param {string} token
 * @returns {Object|null}
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  decodeToken,
};
