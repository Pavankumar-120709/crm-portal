import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return sendError(res, 'Authentication token required', 401);
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`, 403);
    }

    next();
  };
}
