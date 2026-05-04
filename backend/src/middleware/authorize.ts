import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

/**
 * Role-based authorization middleware
 * Usage: authorize('FINANCE_OFFICER', 'ADMIN')
 */
const authorize = (...allowedRoles: string[]) => {
  return (req: Request | any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions. Required roles: ' + allowedRoles.join(', '), 403);
    }

    next();
  };
};

export default authorize;
