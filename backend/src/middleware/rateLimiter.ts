import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

/**
 * ============================================
 * RATE LIMITER CONFIGURATION
 * ============================================
 */

/**
 * Custom key generator that considers user ID if authenticated
 * This allows different limits for authenticated vs unauthenticated users
 */
const keyGenerator = (req: Request): string => {
  // If admin, bypass rate limiting
  if ((req as any).skipRateLimit || req.isAdmin) {
    return `admin-${req.userId || req.ip}`;
  }
  
  // Use user ID if authenticated, otherwise use IP
  return req.userId || req.ip || 'unknown';
};

/**
 * Custom error handler for rate limit responses
 */
const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      retryAfter: req.rateLimit?.resetTime 
        ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
        : undefined,
    },
  });
};

/**
 * Skip function for admins
 */
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  // Skip rate limiting for admins
  if ((req as any).skipRateLimit || req.isAdmin) {
    return true;
  }
  
  // Only count failed requests (4xx, 5xx)
  return res.statusCode < 400;
};

/**
 * Skip function that always checks for admin bypass
 */
const skipForAdmins = (req: Request): boolean => {
  return (req as any).skipRateLimit || req.isAdmin || false;
};

// ============================================
// GENERAL API RATE LIMITER
// ============================================

/**
 * General rate limiter for all API routes
 * Allows 100 requests per 15 minutes per IP/user
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// AUTHENTICATION RATE LIMITERS
// ============================================

/**
 * Strict rate limiter for login attempts
 * Prevents brute force attacks
 * 5 attempts per 15 minutes
 */
export const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Rate limiter for registration
 * Prevents spam account creation
 * 3 registrations per hour per IP
 */
export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many accounts created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown', // Always use IP for registration
  handler: rateLimitHandler,
});

/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset
 * 3 attempts per hour
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for token refresh
 * Prevents token refresh spam
 * 10 refreshes per 15 minutes
 */
export const refreshTokenLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 refreshes per window
  message: 'Too many token refresh requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
});

// ============================================
// PAYMENT RATE LIMITERS
// ============================================

/**
 * Rate limiter for payment creation
 * Prevents payment spam
 * 10 payments per hour per user
 */
export const paymentLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts. Please contact support.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

/**
 * Rate limiter for payment verification
 * 20 verifications per hour per user
 */
export const paymentVerifyLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 verifications per hour
  message: 'Too many verification attempts. Please contact support.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// SUPPORT/CONTACT RATE LIMITERS
// ============================================

/**
 * Rate limiter for contact form submissions
 * 3 submissions per hour per IP
 */
export const contactLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 contact submissions per hour
  message: 'Too many contact form submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown', // Always use IP
  handler: rateLimitHandler,
});

/**
 * Rate limiter for newsletter subscriptions
 * 2 subscriptions per hour per IP
 */
export const newsletterLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 2 newsletter subscriptions per hour
  message: 'Too many subscription attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || 'unknown', // Always use IP
  handler: rateLimitHandler,
});

/**
 * Rate limiter for support ticket creation
 * 5 tickets per day per user
 */
export const ticketLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 tickets per day
  message: 'Too many support tickets created. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// FILE UPLOAD RATE LIMITERS
// ============================================

/**
 * Rate limiter for file uploads
 * 20 uploads per hour per user
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many upload attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// REVIEW RATE LIMITERS
// ============================================

/**
 * Rate limiter for review creation
 * 5 reviews per day per user
 */
export const reviewLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 reviews per day
  message: 'Too many reviews submitted. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// SEARCH RATE LIMITERS
// ============================================

/**
 * Rate limiter for search queries
 * 50 searches per 15 minutes per IP/user
 */
export const searchLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 searches per window
  message: 'Too many search requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// CART/ORDER RATE LIMITERS
// ============================================

/**
 * Rate limiter for order creation
 * 10 orders per hour per user
 */
export const orderLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 orders per hour
  message: 'Too many order attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

/**
 * Rate limiter for cart operations
 * 100 cart operations per 15 minutes per user
 */
export const cartLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 cart operations per window
  message: 'Too many cart operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipForAdmins,
});

// ============================================
// ADMIN OPERATIONS (Relaxed limits)
// ============================================

/**
 * Relaxed rate limiter for admin operations
 * 1000 requests per 15 minutes
 */
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Too many admin requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req: Request) => env.isDevelopment, // No limits in development
});

/**
 * ============================================
 * RATE LIMITER SUMMARY
 * ============================================
 * GENERAL:
 *   generalLimiter          - 100 req/15min  (all API routes)
 * 
 * AUTHENTICATION:
 *   loginLimiter            - 5 req/15min    (only counts failures)
 *   registerLimiter         - 3 req/hour     (IP-based)
 *   passwordResetLimiter    - 3 req/hour
 *   refreshTokenLimiter     - 10 req/15min
 * 
 * PAYMENT:
 *   paymentLimiter          - 10 req/hour
 *   paymentVerifyLimiter    - 20 req/hour
 * 
 * SUPPORT:
 *   contactLimiter          - 3 req/hour     (IP-based)
 *   newsletterLimiter       - 2 req/hour     (IP-based)
 *   ticketLimiter           - 5 req/day
 * 
 * UPLOADS:
 *   uploadLimiter           - 20 req/hour
 * 
 * REVIEWS:
 *   reviewLimiter           - 5 req/day
 * 
 * SEARCH:
 *   searchLimiter           - 50 req/15min
 * 
 * CART/ORDERS:
 *   orderLimiter            - 10 req/hour
 *   cartLimiter             - 100 req/15min
 * 
 * ADMIN:
 *   adminLimiter            - 1000 req/15min (bypassed in dev)
 * 
 * NOTE: Admins automatically bypass most rate limits
 * ============================================
 */