const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../errors');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing or malformed', 'TOKEN_MISSING');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Attach user payload to request
    req.user = {
      id: decoded.sub,
      uuid: decoded.uuid,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
