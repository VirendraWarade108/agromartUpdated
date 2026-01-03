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
      userRole?: 'user' | 'admin' | 'vendor';
    }
  }
}

/**
 * Authentication middleware
 * 
 * Verifies JWT token and adds user info to request
 * Use this on protected routes
 * 
 * @throws AppError(401) if no token provided
 * @throws AppError(401) if token is invalid or expired
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
      throw new AppError('No token provided. Please login to continue.', 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer '

    if (!token || token.trim() === '') {
      throw new AppError('Invalid token format. Please login again.', 401);
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Validate payload structure
    if (!payload.userId || !payload.email) {
      throw new AppError('Invalid token payload. Please login again.', 401);
    }

    // Add user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.isAdmin = payload.isAdmin || false;
    req.userRole = payload.isAdmin ? 'admin' : 'user';

    // Continue to next middleware/controller
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }

    if (error.message === 'Token expired') {
      return next(new AppError('Your session has expired. Please login again.', 401));
    }

    if (error.message === 'Invalid token') {
      return next(new AppError('Invalid authentication token. Please login again.', 401));
    }

    // Catch-all for unexpected JWT errors
    return next(new AppError('Authentication failed. Please login again.', 401));
  }
};

/**
 * Admin-only middleware
 * 
 * Requires user to be authenticated AND be an admin
 * Must be used AFTER authenticate middleware
 * 
 * @throws AppError(401) if not authenticated
 * @throws AppError(403) if not admin
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if user is authenticated
  if (!req.userId) {
    return next(new AppError('Authentication required. Please login.', 401));
  }

  // Check if user is admin
  if (!req.isAdmin) {
    return next(new AppError('Admin access required. You do not have permission to perform this action.', 403));
  }

  next();
};

/**
 * Role-based access control middleware
 * 
 * Requires user to have one of the specified roles
 * Must be used AFTER authenticate middleware
 * 
 * @param roles - Array of allowed roles
 * @throws AppError(401) if not authenticated
 * @throws AppError(403) if role not allowed
 */
export const requireRole = (roles: Array<'user' | 'admin' | 'vendor'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.userId || !req.userRole) {
      return next(new AppError('Authentication required. Please login.', 401));
    }

    // Check if user has required role
    if (!roles.includes(req.userRole)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.userRole}.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * 
 * Adds user info if token is provided, but doesn't require it
 * Useful for routes that work with or without login
 * 
 * @example
 * // Product details - shows personalized data if logged in
 * router.get('/products/:id', optionalAuth, productController.getById);
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
      
      if (token && token.trim() !== '') {
        const payload = verifyAccessToken(token);

        // Only set user info if token is valid
        if (payload.userId && payload.email) {
          req.userId = payload.userId;
          req.userEmail = payload.email;
          req.isAdmin = payload.isAdmin || false;
          req.userRole = payload.isAdmin ? 'admin' : 'user';
        }
      }
    }
  } catch (error) {
    // Token invalid or expired, but continue anyway (optional auth)
    // Don't set any user info - request will be treated as unauthenticated
  }

  next();
};

/**
 * Resource ownership middleware
 * 
 * Ensures user can only access their own resources
 * Admins can access any resource
 * 
 * @param getUserIdFromRequest - Function to extract resource owner's userId
 * @throws AppError(401) if not authenticated
 * @throws AppError(403) if not owner and not admin
 */
export const requireOwnership = (
  getUserIdFromRequest: (req: Request) => string | Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.userId) {
        return next(new AppError('Authentication required. Please login.', 401));
      }

      // Admins can access any resource
      if (req.isAdmin) {
        return next();
      }

      // Get resource owner's userId
      const resourceOwnerId = await Promise.resolve(getUserIdFromRequest(req));

      // Check if user owns the resource
      if (req.userId !== resourceOwnerId) {
        return next(
          new AppError('Access denied. You can only access your own resources.', 403)
        );
      }

      next();
    } catch (error) {
      return next(
        new AppError('Failed to verify resource ownership. Please try again.', 500)
      );
    }
  };
};

/**
 * Self-or-admin middleware
 * 
 * Allows users to access their own data OR admins to access any data
 * Common pattern for profile/user endpoints
 * 
 * @param getTargetUserId - Function to extract target userId from request
 * @throws AppError(401) if not authenticated
 * @throws AppError(403) if not self and not admin
 */
export const requireSelfOrAdmin = (
  getTargetUserId: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.userId) {
      return next(new AppError('Authentication required. Please login.', 401));
    }

    const targetUserId = getTargetUserId(req);

    // Allow if admin OR accessing own data
    if (req.isAdmin || req.userId === targetUserId) {
      return next();
    }

    return next(
      new AppError('Access denied. You can only access your own profile.', 403)
    );
  };
};

/**
 * Rate limit bypass for admins
 * 
 * Sets a flag on request to bypass rate limiting
 * Must be used AFTER authenticate middleware
 */
export const adminBypassRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.isAdmin) {
    (req as any).skipRateLimit = true;
  }
  next();
}