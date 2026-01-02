import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

/**
 * Extend Express Request type to include user info
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      isAdmin?: boolean;
    }
  }
}

/**
 * Authentication middleware
 * 
 * Verifies JWT token and adds user info to request
 * Use this on protected routes
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const payload = verifyAccessToken(token);

    // Add user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.isAdmin = payload.isAdmin;

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    if (error.message === 'Token expired') {
      return next(new AppError('Token expired', 401));
    }
    next(new AppError('Invalid token', 401));
  }
};

/**
 * Admin-only middleware
 * 
 * Requires user to be authenticated AND be an admin
 * Use this on admin routes
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isAdmin) {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

/**
 * Optional authentication middleware
 * 
 * Adds user info if token is provided, but doesn't require it
 * Useful for routes that work with or without login
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.isAdmin = payload.isAdmin;
    }
  } catch (error) {
    // Token invalid, but continue anyway (optional auth)
  }

  next();
};