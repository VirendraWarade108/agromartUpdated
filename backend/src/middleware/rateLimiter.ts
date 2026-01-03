import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * ============================================
 * TYPE DECLARATIONS
 * ============================================
 */

// Extend Express Request to include rate limit info
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

/**
 * ============================================
 * RATE LIMITER CONFIGURATION
 * ============================================
 */

/**
 * Custom error handler for rate limit responses
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  const retryAfter = req.rateLimit?.resetTime 
    ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
    : undefined;

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    },
  });
};

/**
 * Skip function for admins
 */
const skipForAdmins = (req: Request): boolean => {
  return (req as any).skipRateLimit || req.isAdmin || false;
};

// ============================================
// GENERAL API RATE LIMITER
// ============================================

/**
 * General rate limiter for all API routes
 * Allows 100 requests per 15 minutes per IP
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// AUTHENTICATION RATE LIMITERS
// ============================================

/**
 * Strict rate limiter for login attempts
 * Prevents brute force attacks
 */
export const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for registration
 * Prevents spam account creation
 */
export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for password reset requests
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for token refresh
 */
export const refreshTokenLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ============================================
// PAYMENT RATE LIMITERS
// ============================================

/**
 * Rate limiter for payment creation
 */
export const paymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

/**
 * Rate limiter for payment verification
 */
export const paymentVerifyLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// SUPPORT/CONTACT RATE LIMITERS
// ============================================

/**
 * Rate limiter for contact form submissions
 */
export const contactLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for newsletter subscriptions
 */
export const newsletterLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for support ticket creation
 */
export const ticketLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// FILE UPLOAD RATE LIMITERS
// ============================================

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// REVIEW RATE LIMITERS
// ============================================

/**
 * Rate limiter for review creation
 */
export const reviewLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// SEARCH RATE LIMITERS
// ============================================

/**
 * Rate limiter for search queries
 */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// CART/ORDER RATE LIMITERS
// ============================================

/**
 * Rate limiter for order creation
 */
export const orderLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

/**
 * Rate limiter for cart operations
 */
export const cartLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// ADMIN OPERATIONS (Relaxed limits)
// ============================================

/**
 * Relaxed rate limiter for admin operations
 */
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req: Request) => env.isDevelopment,
});