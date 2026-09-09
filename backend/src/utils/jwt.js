const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const { UnauthorizedError } = require('../errors');

function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
    expiresIn: env.JWT.ACCESS_EXPIRATION,
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT.ACCESS_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid access token', 'TOKEN_INVALID');
  }
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};
