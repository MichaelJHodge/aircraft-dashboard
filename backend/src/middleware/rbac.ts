import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../../shared/types';
import { AppError } from '../utils/AppError';

export type Permission =
  | 'dashboard:read'
  | 'aircraft:list'
  | 'aircraft:read'
  | 'aircraft:create'
  | 'aircraft:updateStatus'
  | 'aircraft:updateMilestone';

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.INTERNAL]: [
    'dashboard:read',
    'aircraft:list',
    'aircraft:read',
    'aircraft:create',
    'aircraft:updateStatus',
    'aircraft:updateMilestone',
  ],
  [UserRole.CUSTOMER]: ['dashboard:read', 'aircraft:list', 'aircraft:read'],
};

export function authorizePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void res;

    if (!req.auth) {
      throw new AppError('Unauthorized', 401);
    }

    const permissions = rolePermissions[req.auth.role] ?? [];
    if (!permissions.includes(permission)) {
      throw new AppError('Forbidden', 403);
    }

    next();
  };
}
