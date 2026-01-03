import { Router } from 'express';
import * as adminProductController from '../controllers/adminProductController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as productValidators from '../validators/product';

const router = Router();

/**
 * ============================================
 * ALL ROUTES REQUIRE AUTHENTICATION + ADMIN ROLE
 * Applied globally to all routes in this router
 * ============================================
 */
router.use(authenticate, requireAdmin);

// ============================================
// PRODUCT CRUD
// ============================================

/**
 * Create new product
 * POST /api/admin/products
 * Validation: Required
 */
router.post(
  '/',
  validate(productValidators.createProductSchema),
  adminProductController.createProduct
);

/**
 * Update product
 * PUT /api/admin/products/:id
 * Validation: Required (params + body)
 */
router.put(
  '/:id',
  validate(productValidators.updateProductSchema),
  adminProductController.updateProduct
);

/**
 * Delete product
 * DELETE /api/admin/products/:id
 * Validation: Required (params)
 */
router.delete(
  '/:id',
  validate(productValidators.deleteProductSchema),
  adminProductController.deleteProduct
);

/**
 * Duplicate product
 * POST /api/admin/products/:id/duplicate
 * Validation: Required (params)
 */
router.post(
  '/:id/duplicate',
  validate({
    params: productValidators.deleteProductSchema.params, // Reuse ID validation
  }),
  adminProductController.duplicateProduct
);

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * Bulk update stock
 * PUT /api/admin/products/stock/bulk
 * NOTE: Must come BEFORE /:id routes to avoid conflicts
 * Validation: Will be added in next validator update
 */
router.put(
  '/stock/bulk',
  adminProductController.bulkUpdateStock
);

/**
 * Get low stock products
 * GET /api/admin/products/stock/low
 * NOTE: Must come BEFORE /:id routes to avoid conflicts
 * Validation: None (query params optional)
 */
router.get(
  '/stock/low',
  adminProductController.getLowStockProducts
);

/**
 * Get out of stock products
 * GET /api/admin/products/stock/out
 * NOTE: Must come BEFORE /:id routes to avoid conflicts
 * Validation: None (no input)
 */
router.get(
  '/stock/out',
  adminProductController.getOutOfStockProducts
);

// ============================================
// STATISTICS
// ============================================

/**
 * Get product statistics
 * GET /api/admin/products/stats
 * NOTE: Must come BEFORE /:id routes to avoid conflicts
 * Validation: None (no input)
 */
router.get(
  '/stats',
  adminProductController.getProductStats
);

/**
 * ============================================
 * ROUTE SUMMARY
 * ============================================
 * All routes require: authenticate + requireAdmin
 * 
 * CRUD:
 *   POST   /admin/products              - Create product [VALIDATED]
 *   PUT    /admin/products/:id          - Update product [VALIDATED]
 *   DELETE /admin/products/:id          - Delete product [VALIDATED]
 *   POST   /admin/products/:id/duplicate - Duplicate product [VALIDATED]
 * 
 * STOCK:
 *   PUT    /admin/products/stock/bulk   - Bulk update stock
 *   GET    /admin/products/stock/low    - Get low stock products
 *   GET    /admin/products/stock/out    - Get out of stock products
 * 
 * STATS:
 *   GET    /admin/products/stats        - Get product statistics
 * ============================================
 */

export default router; 