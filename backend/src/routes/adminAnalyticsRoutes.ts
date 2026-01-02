import { Router } from 'express';
import * as adminAnalyticsController from '../controllers/adminAnalyticsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * Get dashboard statistics
 * GET /api/admin/analytics/dashboard
 */
router.get('/dashboard', adminAnalyticsController.getDashboardStats);

/**
 * Get sales report
 * GET /api/admin/analytics/sales
 * Query params: startDate, endDate, groupBy (day|week|month)
 */
router.get('/sales', adminAnalyticsController.getSalesReport);

/**
 * Get product performance
 * GET /api/admin/analytics/products
 * Query params: limit (default: 10)
 */
router.get('/products', adminAnalyticsController.getProductPerformance);

/**
 * Get user statistics
 * GET /api/admin/analytics/users
 */
router.get('/users', adminAnalyticsController.getUserStatistics);

export default router;