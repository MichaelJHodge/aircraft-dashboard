import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/auth';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  void res;
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(token);
  } catch (_error) {
    throw new AppError('Invalid or expired token', 401);
  }

  req.auth = {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    customerName: payload.customerName,
  };

  next();
}
