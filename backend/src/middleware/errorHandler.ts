import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { Prisma } from '@prisma/client';

/**
 * Custom error class with status code and error code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Errors we expect and handle
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
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
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let details = err.details;

  // ============================================
  // PRISMA ERRORS
  // ============================================
  
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        const field = err.meta?.target as string[] | undefined;
        message = field
          ? `A record with this ${field.join(', ')} already exists`
          : 'This record already exists';
        details = { fields: field };
        break;

      case 'P2025':
        // Record not found
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'The requested record was not found';
        break;

      case 'P2003':
        // Foreign key constraint failed
        statusCode = 400;
        code = 'INVALID_REFERENCE';
        message = 'Referenced record does not exist';
        break;

      case 'P2014':
        // Required relation violation
        statusCode = 400;
        code = 'MISSING_RELATION';
        message = 'Required relation is missing';
        break;

      case 'P2015':
        // Related record not found
        statusCode = 404;
        code = 'RELATED_NOT_FOUND';
        message = 'Related record not found';
        break;

      case 'P2016':
        // Query interpretation error
        statusCode = 400;
        code = 'QUERY_ERROR';
        message = 'Invalid query parameters';
        break;

      case 'P2021':
        // Table does not exist
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database table does not exist';
        break;

      case 'P2022':
        // Column does not exist
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database column does not exist';
        break;

      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'A database error occurred';
        if (env.isDevelopment) {
          details = { prismaCode: err.code, meta: err.meta };
        }
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided';
    if (env.isDevelopment) {
      details = { originalError: err.message };
    }
  }

  // Prisma initialization errors
  if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Failed to connect to database';
  }

  // ============================================
  // JWT ERRORS
  // ============================================
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // ============================================
  // VALIDATION ERRORS (express-validator)
  // ============================================
  
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const errors = err.array();
    message = errors.map((e: any) => e.msg).join(', ');
    details = errors;
  }

  // ============================================
  // MULTER ERRORS (File Upload)
  // ============================================
  
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds maximum limit (5MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload error';
    }
  }

  // ============================================
  // RATE LIMIT ERRORS
  // ============================================
  
  if (err.name === 'TooManyRequestsError' || code === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = err.message || 'Too many requests. Please try again later.';
  }

  // ============================================
  // MONGOOSE/MONGODB ERRORS (if ever used)
  // ============================================
  
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(', ');
  }

  // ============================================
  // LOGGING
  // ============================================
  
  // Log all errors in development
  if (env.isDevelopment) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR CAUGHT BY ERROR HANDLER');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Status:', statusCode);
    console.error('Code:', code);
    console.error('Message:', message);
    console.error('Original Error:', err);
    if (err.stack) {
      console.error('Stack:', err.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Log only critical errors in production (5xx)
  if (env.isProduction && statusCode >= 500) {
    console.error('CRITICAL ERROR:', {
      timestamp: new Date().toISOString(),
      statusCode,
      code,
      message,
      path: req.path,
      method: req.method,
      userId: req.userId,
      stack: err.stack,
    });
  }

  // ============================================
  // SEND RESPONSE
  // ============================================
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(env.isDevelopment && err.stack && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
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

/**
 * Create standardized error response
 */
export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): never => {
  throw new AppError(message, statusCode, code, details);
};