import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as reviewService from '../services/reviewService';

// ============================================
// PUBLIC REVIEW ENDPOINTS
// ============================================

/**
 * Get product reviews
 * GET /api/products/:productId/reviews
 * Query params: rating, page, limit, sortBy
 */
export const getProductReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { rating, page, limit, sortBy } = req.query;

    // Validate productId
    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required',
        },
      });
    }

    const result = await reviewService.getProductReviews(productId, {
      rating: rating ? parseInt(rating as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as any,
    });

    res.json({
      success: true,
      data: {
        reviews: result.reviews,
        pagination: result.pagination,
      },
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

    // Validate productId
    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required',
        },
      });
    }

    const stats = await reviewService.getProductReviewStats(productId);

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Mark review as helpful
 * POST /api/reviews/:id/helpful
 * No authentication required (public endpoint)
 */
export const markReviewHelpful = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Review ID is required',
        },
      });
    }

    const review = await reviewService.markReviewHelpful(id);

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        id: review.id,
        helpfulCount: review.helpfulCount,
      },
    });
  }
);

// ============================================
// USER REVIEW ENDPOINTS (Authenticated)
// ============================================

/**
 * Create a review (primary endpoint)
 * POST /api/reviews
 * Body: { productId, rating, title?, comment, images? }
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId, rating, title, comment, images } = req.body;

    // Validate required fields
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID, rating, and comment are required',
        },
      });
    }

    // Validate types
    if (typeof productId !== 'string' || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid product ID',
        },
      });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Rating must be between 1 and 5',
        },
      });
    }

    if (typeof comment !== 'string' || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Comment is required',
        },
      });
    }

    // Validate images array if provided
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Images must be an array',
        },
      });
    }

    const review = await reviewService.createReview({
      userId,
      productId: productId.trim(),
      rating: parsedRating,
      title: title ? String(title) : undefined,
      comment: comment.trim(),
      images: images || undefined,
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
 * Body: { rating, title?, comment, images? }
 */
export const createProductReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;

    // Validate productId from params
    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required',
        },
      });
    }

    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Rating and comment are required',
        },
      });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Rating must be between 1 and 5',
        },
      });
    }

    if (typeof comment !== 'string' || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Comment is required',
        },
      });
    }

    // Validate images array if provided
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Images must be an array',
        },
      });
    }

    const review = await reviewService.createReview({
      userId,
      productId: productId.trim(),
      rating: parsedRating,
      title: title ? String(title) : undefined,
      comment: comment.trim(),
      images: images || undefined,
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
 * Body: { rating?, title?, comment?, images? }
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Review ID is required',
        },
      });
    }

    // Validate at least one field is provided
    if (rating === undefined && title === undefined && comment === undefined && images === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'At least one field must be provided for update',
        },
      });
    }

    // Validate rating if provided
    let parsedRating: number | undefined;
    if (rating !== undefined) {
      parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Rating must be between 1 and 5',
          },
        });
      }
    }

    // Validate comment if provided
    if (comment !== undefined && (typeof comment !== 'string' || comment.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Comment cannot be empty',
        },
      });
    }

    // Validate images array if provided
    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Images must be an array',
        },
      });
    }

    const review = await reviewService.updateReview(id, userId, {
      rating: parsedRating,
      title: title !== undefined ? String(title) : undefined,
      comment: comment !== undefined ? comment.trim() : undefined,
      images: images,
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

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Review ID is required',
        },
      });
    }

    const result = await reviewService.deleteReview(id, userId);

    res.json({
      success: true,
      message: result.message,
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
 * Query params: productId, userId, rating, page, limit
 */
export const getAllReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, userId, rating, page, limit } = req.query;

    // Validate pagination params
    let parsedPage: number | undefined;
    let parsedLimit: number | undefined;
    let parsedRating: number | undefined;

    if (page) {
      parsedPage = parseInt(page as string);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Page must be a positive number',
          },
        });
      }
    }

    if (limit) {
      parsedLimit = parseInt(limit as string);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Limit must be between 1 and 100',
          },
        });
      }
    }

    if (rating) {
      parsedRating = parseInt(rating as string);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Rating must be between 1 and 5',
          },
        });
      }
    }

    const result = await reviewService.getAllReviews({
      productId: productId as string,
      userId: userId as string,
      rating: parsedRating,
      page: parsedPage,
      limit: parsedLimit,
    });

    res.json({
      success: true,
      data: {
        reviews: result.reviews,
        pagination: result.pagination,
      },
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

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Review ID is required',
        },
      });
    }

    const result = await reviewService.deleteReviewAdmin(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);