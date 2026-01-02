import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Errors we expect and handle
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * 
 * Catches all errors thrown in controllers/routes
 * Sends consistent error response to frontend
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    statusCode = 400;
    message = 'This record already exists';
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404;
    message = 'Record not found';
  }

  // Validation errors (express-validator)
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    const errors = err.array();
    message = errors.map((e: any) => e.msg).join(', ');
  }

  // Log error in development
  if (env.isDevelopment) {
    console.error('❌ Error:', err);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDevelopment && { stack: err.stack }), // Only in dev
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};