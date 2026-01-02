import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Public routes (no authentication required)
 */
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/products', categoryController.getCategoryProducts);

/**
 * Admin routes (authentication + admin role required)
 */
router.post(
  '/admin',
  authenticate,
  requireAdmin,
  categoryController.createCategory
);

router.put(
  '/admin/:id',
  authenticate,
  requireAdmin,
  categoryController.updateCategory
);

router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  categoryController.deleteCategory
);

export default router;