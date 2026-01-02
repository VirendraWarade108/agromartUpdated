import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * All user routes require authentication
 */

/**
 * Get user profile
 * GET /api/users/profile
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * Change password
 * PUT /api/users/password
 */
router.put('/password', authenticate, userController.changePassword);

/**
 * Get user's order history
 * GET /api/users/orders
 */
router.get('/orders', authenticate, userController.getOrderHistory);

export default router;