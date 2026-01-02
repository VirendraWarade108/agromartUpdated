import { Router } from 'express';
import * as reviewController from '../controllers/reviewcontroller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * Get product reviews
 * GET /api/products/:productId/reviews
 * Query: ?rating=5&page=1&limit=10&sortBy=recent
 */
router.get(
  '/products/:productId/reviews',
  reviewController.getProductReviews
);

/**
 * Get product review statistics
 * GET /api/products/:productId/reviews/stats
 * Returns: totalReviews, averageRating, ratingDistribution
 */
router.get(
  '/products/:productId/reviews/stats',
  reviewController.getProductReviewStats
);

/**
 * Mark review as helpful (public - no auth)
 * POST /api/reviews/:id/helpful
 */
router.post('/:id/helpful', reviewController.markReviewHelpful);

// ============================================
// USER ROUTES (Authentication required)
// ============================================

/**
 * Get my reviews
 * GET /api/reviews/my-reviews
 * IMPORTANT: Must come before /:id to avoid route conflicts
 */
router.get('/my-reviews', authenticate, reviewController.getMyReviews);

/**
 * Create a review (primary endpoint)
 * POST /api/reviews
 * Body: { productId, rating, title?, comment, images? }
 */
router.post('/', authenticate, reviewController.createReview);

/**
 * Create a review for a specific product (frontend compatibility)
 * POST /api/products/:productId/reviews
 * Body: { rating, title?, comment, images? }
 */
router.post(
  '/products/:productId/reviews',
  authenticate,
  reviewController.createProductReview
);

/**
 * Update a review
 * PUT /api/reviews/:id
 * Body: { rating?, title?, comment?, images? }
 */
router.put('/:id', authenticate, reviewController.updateReview);

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
router.delete('/:id', authenticate, reviewController.deleteReview);

// ============================================
// ADMIN ROUTES (Authentication + Admin required)
// ============================================

/**
 * Get all reviews (Admin)
 * GET /api/admin/reviews
 * Query: ?productId=xxx&userId=xxx&rating=5&page=1&limit=20
 */
router.get('/admin', authenticate, requireAdmin, reviewController.getAllReviews);

/**
 * Delete review (Admin)
 * DELETE /api/admin/reviews/:id
 */
router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  reviewController.deleteReviewAdmin
);

export default router;