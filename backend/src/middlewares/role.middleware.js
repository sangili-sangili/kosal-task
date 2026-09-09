const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

/**
 * Role-based Authorization Middleware
 * Enforces access control based on user role
 * @param  {...string} allowedRoles - Roles permitted to access the route (e.g. 'ADMIN', 'SALES')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'AUTHENTICATION_REQUIRED'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
}

module.exports = authorize;
