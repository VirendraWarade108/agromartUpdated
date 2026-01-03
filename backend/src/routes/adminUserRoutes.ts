import { Router } from 'express';
import * as adminUserController from '../controllers/adminUserController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

/**
 * ============================================
 * ALL ROUTES REQUIRE AUTHENTICATION + ADMIN ROLE
 * Applied globally to all routes in this router
 * ============================================
 */
router.use(authenticate, requireAdmin);

// ============================================
// INLINE VALIDATORS (Admin User Operations)
// ============================================

const getUsersQuerySchema = {
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n > 0, 'Page must be at least 1')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('20'),
    role: z
      .enum(['user', 'admin', 'vendor'])
      .optional(),
    search: z
      .string()
      .min(1)
      .max(100)
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
};

const userIdParamSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid user ID'),
  }),
};

const createUserSchema = {
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)')
      .optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    role: z
      .enum(['user', 'admin', 'vendor'])
      .default('user'),
  }),
};

const updateUserSchema = {
  params: z.object({
    id: z.string().cuid('Invalid user ID'),
  }),
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number')
      .optional()
      .nullable(),
    role: z
      .enum(['user', 'admin', 'vendor'])
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  }),
};

const bulkAdminStatusSchema = {
  body: z.object({
    userIds: z
      .array(z.string().cuid('Invalid user ID'))
      .min(1, 'At least one user ID is required')
      .max(50, 'Cannot update more than 50 users at once'),
    isAdmin: z
      .boolean(),
  }),
};

// ============================================
// USER STATISTICS (Must come before /:id routes)
// ============================================

/**
 * Get user statistics
 * GET /api/admin/users/stats
 * Validation: None (no input)
 */
router.get('/stats', adminUserController.getUserStats);

/**
 * Bulk update admin status
 * PUT /api/admin/users/bulk-admin
 * Validation: Required
 */
router.put(
  '/bulk-admin',
  validate(bulkAdminStatusSchema),
  adminUserController.bulkUpdateAdminStatus
);

// ============================================
// USER CRUD
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 * Validation: Query params
 */
router.get(
  '/',
  validate(getUsersQuerySchema),
  adminUserController.getAllUsers
);

/**
 * Create user
 * POST /api/admin/users
 * Validation: Required
 */
router.post(
  '/',
  validate(createUserSchema),
  adminUserController.createUser
);

/**
 * Get user by ID
 * GET /api/admin/users/:id
 * Validation: Required (params)
 */
router.get(
  '/:id',
  validate(userIdParamSchema),
  adminUserController.getUserById
);

/**
 * Update user
 * PUT /api/admin/users/:id
 * Validation: Required (params + body)
 */
router.put(
  '/:id',
  validate(updateUserSchema),
  adminUserController.updateUser
);

/**
 * Delete user
 * DELETE /api/admin/users/:id
 * Validation: Required (params)
 */
router.delete(
  '/:id',
  validate(userIdParamSchema),
  adminUserController.deleteUser
);

/**
 * Get user activity
 * GET /api/admin/users/:id/activity
 * Validation: Required (params)
 */
router.get(
  '/:id/activity',
  validate(userIdParamSchema),
  adminUserController.getUserActivity
);

/**
 * ============================================
 * ROUTE SUMMARY
 * ============================================
 * All routes require: authenticate + requireAdmin
 * 
 * STATS:
 *   GET    /admin/users/stats          - Get user statistics
 *   PUT    /admin/users/bulk-admin     - Bulk update admin status [VALIDATED]
 * 
 * CRUD:
 *   GET    /admin/users                - Get all users [VALIDATED]
 *   POST   /admin/users                - Create user [VALIDATED]
 *   GET    /admin/users/:id            - Get user by ID [VALIDATED]
 *   PUT    /admin/users/:id            - Update user [VALIDATED]
 *   DELETE /admin/users/:id            - Delete user [VALIDATED]
 *   GET    /admin/users/:id/activity   - Get user activity [VALIDATED]
 * ============================================
 */

export default router;