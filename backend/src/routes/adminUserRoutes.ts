import { Router } from 'express';
import * as adminUserController from '../controllers/adminUserController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============================================
// USER STATISTICS (Must come before /:id routes)
// ============================================

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
router.get('/stats', adminUserController.getUserStats);

/**
 * Bulk update admin status
 * PUT /api/admin/users/bulk-admin
 */
router.put('/bulk-admin', adminUserController.bulkUpdateAdminStatus);

// ============================================
// USER CRUD
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 */
router.get('/', adminUserController.getAllUsers);

/**
 * Create user
 * POST /api/admin/users
 */
router.post('/', adminUserController.createUser);

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
router.get('/:id', adminUserController.getUserById);

/**
 * Update user
 * PUT /api/admin/users/:id
 */
router.put('/:id', adminUserController.updateUser);

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
router.delete('/:id', adminUserController.deleteUser);

/**
 * Get user activity
 * GET /api/admin/users/:id/activity
 */
router.get('/:id/activity', adminUserController.getUserActivity);

export default router;