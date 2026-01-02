import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as reviewService from '../services/reviewService';

// ============================================
// PUBLIC REVIEW ENDPOINTS
// ============================================

/**
 * Get product reviews
 * GET /api/products/:productId/reviews
 */
export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { rating, page, limit, sortBy } = req.query;

    const result = await reviewService.getProductReviews(productId, {
      rating: rating ? parseInt(rating as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as any,
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  }
);

/**
 * Get product review statistics
 * GET /api/products/:productId/reviews/stats
 */
export const getProductReviewStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const stats = await reviewService.getProductReviewStats(productId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

// ============================================
// USER REVIEW ENDPOINTS (Authenticated)
// ============================================

/**
 * Create a review
 * POST /api/reviews
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId, rating, title, comment, images } = req.body;

    // Validate required fields
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, and comment are required',
      });
    }

    const review = await reviewService.createReview({
      userId,
      productId,
      rating: parseInt(rating),
      title,
      comment,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  }
);

/**
 * Create a review for a specific product (frontend compatibility)
 * POST /api/products/:productId/reviews
 */
export const createProductReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params; // Extract from URL params
    const { rating, title, comment, images } = req.body;

    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required',
      });
    }

    const review = await reviewService.createReview({
      userId,
      productId,
      rating: parseInt(rating),
      title,
      comment,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  }
);

/**
 * Update a review
 * PUT /api/reviews/:id
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    const review = await reviewService.updateReview(id, userId, {
      rating: rating ? parseInt(rating) : undefined,
      title,
      comment,
      images,
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  }
);

/**
 * Delete a review
 * DELETE /api/reviews/:id
 */
export const deleteReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await reviewService.deleteReview(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * Mark review as helpful
 * POST /api/reviews/:id/helpful
 */
export const markReviewHelpful = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const review = await reviewService.markReviewHelpful(id);

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: review.helpfulCount,
      },
    });
  }
);

/**
 * Get user's reviews
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const reviews = await reviewService.getUserReviews(userId);

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  }
);

// ============================================
// ADMIN REVIEW ENDPOINTS
// ============================================

/**
 * Get all reviews (Admin)
 * GET /api/admin/reviews
 */
export const getAllReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, userId, rating, page, limit } = req.query;

    const result = await reviewService.getAllReviews({
      productId: productId as string,
      userId: userId as string,
      rating: rating ? parseInt(rating as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  }
);

/**
 * Delete review (Admin)
 * DELETE /api/admin/reviews/:id
 */
export const deleteReviewAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await reviewService.deleteReviewAdmin(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);