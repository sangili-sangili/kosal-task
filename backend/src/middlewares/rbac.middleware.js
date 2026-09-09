const { ForbiddenError } = require('../errors');
const { ROLES } = require('../constants/roles');

/**
 * Role-Based Access Control (RBAC) authorization middleware
 * @param {Array<string>} allowedRoles - List of allowed role names
 * @param {Array<string>} requiredPermissions - List of required granular permissions
 */
function authorize(allowedRoles = [], requiredPermissions = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User context not initialized'));
    }

    const userRoles = req.user.roles || [];
    const userPermissions = req.user.permissions || [];

    // Super Admin bypasses all checks
    if (userRoles.includes(ROLES.SUPER_ADMIN)) {
      return next();
    }

    // Role check
    if (allowedRoles.length > 0) {
      const hasRole = allowedRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        return next(new ForbiddenError('You do not have the required role to access this resource'));
      }
    }

    // Granular permission check
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
      if (!hasPermission) {
        return next(new ForbiddenError('You do not possess the necessary permissions for this action'));
      }
    }

    return next();
  };
}

module.exports = authorize;
