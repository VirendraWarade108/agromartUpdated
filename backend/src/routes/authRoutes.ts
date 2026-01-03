import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as authValidators from '../validators/auth';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  refreshTokenLimiter,
} from '../middleware/rateLimiter';

const router = Router();

/**
 * ============================================
 * PUBLIC ROUTES (No authentication required)
 * ============================================
 */

/**
 * Register new user
 * POST /api/auth/register
 * Rate Limited: 3 registrations per hour per IP
 * Validation: Required
 */
router.post(
  '/register',
  registerLimiter,
  validate(authValidators.registerSchema),
  authController.register
);

/**
 * Login user
 * POST /api/auth/login
 * Rate Limited: 5 failed attempts per 15 minutes
 * Validation: Required
 */
router.post(
  '/login',
  loginLimiter,
  validate(authValidators.loginSchema),
  authController.login
);

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Rate Limited: 10 refreshes per 15 minutes
 * Validation: Required
 */
router.post(
  '/refresh',
  refreshTokenLimiter,
  validate(authValidators.refreshSchema),
  authController.refresh
);

/**
 * ============================================
 * PROTECTED ROUTES (Authentication required)
 * ============================================
 */

/**
 * Get current user profile
 * GET /api/auth/profile
 * Alias: GET /api/auth/me
 * Rate Limited: No (read-only operation)
 * Validation: None (no input)
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * Update user profile
 * PUT /api/auth/profile
 * Rate Limited: No (authenticated users only)
 * Validation: Required
 */
router.put(
  '/profile',
  authenticate,
  validate(authValidators.updateProfileSchema),
  authController.updateProfile
);

/**
 * ============================================
 * ROUTE SUMMARY WITH PROTECTION
 * ============================================
 * PUBLIC (Rate Limited):
 *   POST   /auth/register           - 3 req/hour per IP [VALIDATED]
 *   POST   /auth/login              - 5 failed/15min [VALIDATED]
 *   POST   /auth/refresh            - 10 req/15min [VALIDATED]
 * 
 * PROTECTED (No Rate Limits):
 *   GET    /auth/profile            - Authenticated only
 *   GET    /auth/me                 - Authenticated only (alias)
 *   PUT    /auth/profile            - Authenticated only [VALIDATED]
 * 
 * NOTE: Password reset and email verification routes need to be 
 * implemented in authController before they can be enabled here.
 * ============================================
 */

export default router;