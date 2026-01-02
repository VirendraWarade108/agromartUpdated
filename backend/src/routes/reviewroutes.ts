import { Router } from 'express';
import * as reviewController from '../controllers/reviewcontroller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * Get product reviews
 * GET /api/products/:productId/reviews
 */
router.get(
  '/products/:productId/reviews',
  reviewController.getProductReviews
);

/**
 * Get product review statistics
 * GET /api/products/:productId/reviews/stats
 */
router.get(
  '/products/:productId/reviews/stats',
  reviewController.getProductReviewStats
);

// ============================================
// USER ROUTES (Authentication required)
// ============================================

/**
 * Get my reviews
 * GET /api/reviews/my-reviews
 * Note: Must come before /:id to avoid route conflicts
 */
router.get('/my-reviews', authenticate, reviewController.getMyReviews);

/**
 * Create a review (primary endpoint)
 * POST /api/reviews
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * Create a review for a specific product (frontend compatibility alias)
 * POST /api/products/:productId/reviews
 */
router.post(
  '/products/:productId/reviews',
  authenticate,
  reviewController.createProductReview
);

/**
 * Update a review
 * PUT /api/reviews/:id
 */
router.put('/:id', authenticate, reviewController.updateReview);

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

/**
 * Mark review as helpful
 * POST /api/reviews/:id/helpful
 */
router.post('/:id/helpful', reviewController.markReviewHelpful);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get all reviews
 * GET /api/admin/reviews
 */
router.get('/admin', authenticate, requireAdmin, reviewController.getAllReviews);

/**
 * Delete review
 * DELETE /api/admin/reviews/:id
 */
router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  reviewController.deleteReviewAdmin
);

export default router;