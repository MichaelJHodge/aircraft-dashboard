import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { logger } from '../lib/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  void next;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: 'Application Error',
      message: error.message,
      details: error.details,
    });
    return;
  }

  logger.error(
    {
      err: error,
      method: req.method,
      path: req.path,
    },
    'Unhandled application error'
  );

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
}
