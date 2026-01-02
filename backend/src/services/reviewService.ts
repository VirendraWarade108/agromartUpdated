import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ============================================
// TYPED ERRORS
// ============================================
export class ReviewNotAllowedError extends AppError {
  constructor(message: string = 'You can only review products you have purchased') {
    super(message, 403);
    this.name = 'REVIEW_NOT_ALLOWED';
  }
}

export class DuplicateReviewError extends AppError {
  constructor(message: string = 'You have already reviewed this product') {
    super(message, 400);
    this.name = 'DUPLICATE_REVIEW';
  }
}

export class ReviewNotFoundError extends AppError {
  constructor(message: string = 'Review not found') {
    super(message, 404);
    this.name = 'NOT_FOUND';
  }
}

// ============================================
// INTERFACES
// ============================================
interface CreateReviewData {
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

interface ReviewFilters {
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
}

interface AdminReviewFilters {
  productId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

// ============================================
// HELPER: UPDATE PRODUCT RATING
// ============================================
/**
 * Atomically update product rating and review count
 * Uses aggregation to ensure accuracy
 */
const updateProductRating = async (productId: string): Promise<void> => {
  try {
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || null,
        reviewCount: stats._count.rating || 0,
      },
    });
  } catch (error) {
    console.error('Failed to update product rating:', error);
    throw new AppError('Failed to update product rating', 500);
  }
};

// ============================================
// HELPER: VALIDATE PURCHASE
// ============================================
/**
 * Check if user has purchased and received the product
 * Only delivered orders count as verified purchases
 */
const validatePurchase = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'delivered',
        },
      },
    });

    return !!purchase;
  } catch (error) {
    console.error('Failed to validate purchase:', error);
    return false;
  }
};

// ============================================
// GET PRODUCT REVIEWS
// ============================================
export const getProductReviews = async (
  productId: string,
  filters?: ReviewFilters
) => {
  const { rating, page = 1, limit = 10, sortBy = 'recent' } = filters || {};
  const skip = (page - 1) * limit;

  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new ReviewNotFoundError('Product not found');
  }

  // Build where clause
  const where: any = { productId };
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    where.rating = rating;
  }

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'helpful') orderBy = { helpfulCount: 'desc' };
  if (sortBy === 'rating_high') orderBy = { rating: 'desc' };
  if (sortBy === 'rating_low') orderBy = { rating: 'asc' };

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    throw new AppError('Failed to fetch reviews', 500);
  }
};

// ============================================
// GET REVIEW STATISTICS
// ============================================
export const getProductReviewStats = async (productId: string) => {
  // Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    throw new ReviewNotFoundError('Product not found');
  }

  try {
    const [totalReviews, avgRating, ratingDistribution] = await Promise.all([
      prisma.review.count({ where: { productId } }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    // Format rating distribution (1-5 stars)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        distribution[item.rating] = item._count.rating;
      }
    });

    return {
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution: distribution,
    };
  } catch (error) {
    console.error('Failed to fetch review stats:', error);
    throw new AppError('Failed to fetch review statistics', 500);
  }
};

// ============================================
// CREATE REVIEW
// ============================================
export const createReview = async (reviewData: CreateReviewData) => {
  const { userId, productId, rating, title, comment, images } = reviewData;

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Validate comment
  if (!comment || comment.trim().length === 0) {
    throw new AppError('Comment is required', 400);
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new ReviewNotFoundError('Product not found');
    }

    // Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingReview) {
      throw new DuplicateReviewError();
    }

    // Validate purchase
    const hasPurchased = await validatePurchase(userId, productId);

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title?.trim() || null,
        comment: comment.trim(),
        images: images && images.length > 0 ? (images as any) : undefined,
        isVerifiedPurchase: hasPurchased,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating atomically
    await updateProductRating(productId);

    return review;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to create review:', error);
    throw new AppError('Failed to create review', 500);
  }
};

// ============================================
// UPDATE REVIEW
// ============================================
export const updateReview = async (
  reviewId: string,
  userId: string,
  updateData: UpdateReviewData
) => {
  try {
    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, productId: true },
    });

    if (!existingReview) {
      throw new ReviewNotFoundError();
    }

    if (existingReview.userId !== userId) {
      throw new AppError('You can only update your own reviews', 403);
    }

    // Validate rating if provided
    if (updateData.rating !== undefined) {
      if (updateData.rating < 1 || updateData.rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }
    }

    // Validate comment if provided
    if (updateData.comment !== undefined && updateData.comment.trim().length === 0) {
      throw new AppError('Comment cannot be empty', 400);
    }

    // Prepare update data
    const dataToUpdate: any = {};
    if (updateData.rating !== undefined) dataToUpdate.rating = updateData.rating;
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title?.trim() || null;
    if (updateData.comment !== undefined) dataToUpdate.comment = updateData.comment.trim();
    if (updateData.images !== undefined) {
      dataToUpdate.images = updateData.images.length > 0 ? (updateData.images as any) : undefined;
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product rating if rating changed
    if (updateData.rating !== undefined) {
      await updateProductRating(existingReview.productId);
    }

    return updatedReview;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to update review:', error);
    throw new AppError('Failed to update review', 500);
  }
};

// ============================================
// DELETE REVIEW
// ============================================
export const deleteReview = async (reviewId: string, userId: string) => {
  try {
    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, productId: true },
    });

    if (!review) {
      throw new ReviewNotFoundError();
    }

    if (review.userId !== userId) {
      throw new AppError('You can only delete your own reviews', 403);
    }

    const productId = review.productId;

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product rating atomically
    await updateProductRating(productId);

    return { message: 'Review deleted successfully' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to delete review:', error);
    throw new AppError('Failed to delete review', 500);
  }
};

// ============================================
// MARK REVIEW AS HELPFUL
// ============================================
export const markReviewHelpful = async (reviewId: string) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      throw new ReviewNotFoundError();
    }

    // Increment helpful count
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        helpfulCount: true,
      },
    });

    return updatedReview;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to mark review as helpful:', error);
    throw new AppError('Failed to mark review as helpful', 500);
  }
};

// ============================================
// GET USER'S REVIEWS
// ============================================
export const getUserReviews = async (userId: string) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            images: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  } catch (error) {
    console.error('Failed to fetch user reviews:', error);
    throw new AppError('Failed to fetch user reviews', 500);
  }
};

// ============================================
// GET ALL REVIEWS (ADMIN)
// ============================================
export const getAllReviews = async (filters?: AdminReviewFilters) => {
  const { productId, userId, rating, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (productId) where.productId = productId;
  if (userId) where.userId = userId;
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    where.rating = rating;
  }

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error('Failed to fetch all reviews:', error);
    throw new AppError('Failed to fetch reviews', 500);
  }
};

// ============================================
// DELETE REVIEW (ADMIN)
// ============================================
export const deleteReviewAdmin = async (reviewId: string) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, productId: true },
    });

    if (!review) {
      throw new ReviewNotFoundError();
    }

    const productId = review.productId;

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product rating atomically
    await updateProductRating(productId);

    return { message: 'Review deleted successfully' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to delete review (admin):', error);
    throw new AppError('Failed to delete review', 500);
  }
};