import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Admin category routes - all require authentication + admin role
 * Mounted at /api/admin/categories
 * 
 * These routes provide the same functionality as /api/categories/admin/*
 * but match the frontend's expected API structure.
 */

/**
 * Create new category
 * POST /api/admin/categories
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  categoryController.createCategory
);

/**
 * Update existing category
 * PUT /api/admin/categories/:id
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  categoryController.updateCategory
);

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  categoryController.deleteCategory
);

export default router;