import { Router } from 'express';
import * as adminProductController from '../controllers/adminProductController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// ============================================
// PRODUCT CRUD
// ============================================

/**
 * Create new product
 * POST /api/admin/products
 */
router.post('/', adminProductController.createProduct);

/**
 * Update product
 * PUT /api/admin/products/:id
 */
router.put('/:id', adminProductController.updateProduct);

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
router.delete('/:id', adminProductController.deleteProduct);

/**
 * Duplicate product
 * POST /api/admin/products/:id/duplicate
 */
router.post('/:id/duplicate', adminProductController.duplicateProduct);

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * Bulk update stock
 * PUT /api/admin/products/stock/bulk
 */
router.put('/stock/bulk', adminProductController.bulkUpdateStock);

/**
 * Get low stock products
 * GET /api/admin/products/stock/low
 */
router.get('/stock/low', adminProductController.getLowStockProducts);

/**
 * Get out of stock products
 * GET /api/admin/products/stock/out
 */
router.get('/stock/out', adminProductController.getOutOfStockProducts);

// ============================================
// STATISTICS
// ============================================

/**
 * Get product statistics
 * GET /api/admin/products/stats
 */
router.get('/stats', adminProductController.getProductStats);

export default router;