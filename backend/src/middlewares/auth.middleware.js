const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and attaches decoded user claims to req.user
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing or malformed', 'TOKEN_MISSING');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing or malformed', 'TOKEN_MISSING');
    }

    const decoded = verifyAccessToken(token);

    // Attach user payload to request object
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
