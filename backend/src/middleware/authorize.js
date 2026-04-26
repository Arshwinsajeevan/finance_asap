const { error } = require('../utils/response');

/**
 * Role-based authorization middleware
 * Usage: authorize('FINANCE_OFFICER', 'ADMIN')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions. Required roles: ' + allowedRoles.join(', '), 403);
    }

    next();
  };
};

module.exports = authorize;
