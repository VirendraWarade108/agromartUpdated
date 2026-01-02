import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { upload } from '../services/uploadService';

const router = Router();

// ============================================
// GENERIC IMAGE UPLOADS (Frontend compatibility)
// Routes must come BEFORE specific routes to avoid conflicts
// ============================================

/**
 * Upload single image (generic endpoint for frontend)
 * POST /api/upload/image
 * Accepts optional 'folder' in FormData to specify destination
 */
router.post(
  '/image',
  authenticate, // Require auth, but not admin
  upload.single('image'),
  uploadController.uploadImage
);

/**
 * Upload multiple images (generic endpoint for frontend)
 * POST /api/upload/multiple
 * Accepts optional 'folder' in FormData to specify destination
 */
router.post(
  '/multiple',
  authenticate, // Require auth, but not admin
  upload.array('images', 10), // Max 10 images
  uploadController.uploadMultipleImages
);

// ============================================
// PRODUCT IMAGE UPLOADS (Admin only)
// ============================================

/**
 * Upload single product image
 * POST /api/upload/product
 */
router.post(
  '/product',
  authenticate,
  requireAdmin,
  upload.single('image'),
  uploadController.uploadProductImage
);

/**
 * Upload multiple product images
 * POST /api/upload/products
 */
router.post(
  '/products',
  authenticate,
  requireAdmin,
  upload.array('images', 10), // Max 10 images
  uploadController.uploadProductImages
);

// ============================================
// REVIEW IMAGE UPLOADS (Authenticated users)
// ============================================

/**
 * Upload single review image
 * POST /api/upload/review
 */
router.post(
  '/review',
  authenticate,
  upload.single('image'),
  uploadController.uploadReviewImage
);

/**
 * Upload multiple review images
 * POST /api/upload/reviews
 */
router.post(
  '/reviews',
  authenticate,
  upload.array('images', 5), // Max 5 images
  uploadController.uploadReviewImages
);

// ============================================
// PROFILE IMAGE UPLOAD (Authenticated users)
// ============================================

/**
 * Upload profile image
 * POST /api/upload/profile
 */
router.post(
  '/profile',
  authenticate,
  upload.single('image'),
  uploadController.uploadProfileImage
);

// ============================================
// DELETE IMAGE
// ============================================

/**
 * Delete image
 * DELETE /api/upload/:type/:filename
 */
router.delete(
  '/:type/:filename',
  authenticate,
  uploadController.deleteImage
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get upload statistics
 * GET /api/admin/upload/stats
 */
router.get(
  '/admin/stats',
  authenticate,
  requireAdmin,
  uploadController.getUploadStats
);

/**
 * Clean up old files
 * POST /api/admin/upload/cleanup
 */
router.post(
  '/admin/cleanup',
  authenticate,
  requireAdmin,
  uploadController.cleanupOldFiles
);

export default router;