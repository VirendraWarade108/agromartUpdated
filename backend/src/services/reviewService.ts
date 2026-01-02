import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get product reviews
 */
export const getProductReviews = async (
  productId: string,
  filters?: {
    rating?: number;
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  }
) => {
  const { rating, page = 1, limit = 10, sortBy = 'recent' } = filters || {};
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { productId };
  if (rating) where.rating = rating;

  // Build orderBy
  let orderBy: any = { createdAt: 'desc' }; // default
  if (sortBy === 'helpful') orderBy = { helpfulCount: 'desc' };
  if (sortBy === 'rating_high') orderBy = { rating: 'desc' };
  if (sortBy === 'rating_low') orderBy = { rating: 'asc' };

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
    },
  };
};

/**
 * Get review statistics for a product
 */
export const getProductReviewStats = async (productId: string) => {
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

  // Format rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach((item) => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating;
  });

  return {
    totalReviews,
    averageRating: avgRating._avg.rating || 0,
    ratingDistribution: distribution,
  };
};

/**
 * Create a review
 */
export const createReview = async (reviewData: {
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}) => {
  // Validate rating
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: reviewData.productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user already reviewed this product
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: reviewData.userId,
        productId: reviewData.productId,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // Check if user purchased this product (verified purchase)
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: reviewData.productId,
      order: {
        userId: reviewData.userId,
        status: 'delivered', // Only delivered orders count
      },
    },
  });

  // Create review
  const review = await prisma.review.create({
    data: {
      userId: reviewData.userId,
      productId: reviewData.productId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      images: reviewData.images ? (reviewData.images as any) : null,
      isVerifiedPurchase: !!hasPurchased,
    },
    include: {
      user: {
        select: {
          id: true,
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

  // Update product rating and review count
  await updateProductRating(reviewData.productId);

  return review;
};

/**
 * Update a review
 */
export const updateReview = async (
  reviewId: string,
  userId: string,
  updateData: {
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
  }
) => {
  // Check if review exists and belongs to user
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existingReview) {
    throw new AppError('Review not found', 404);
  }

  if (existingReview.userId !== userId) {
    throw new AppError('You can only update your own reviews', 403);
  }

  // Validate rating if provided
  if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  // Prepare update data
  const dataToUpdate: any = {};
  if (updateData.rating !== undefined) dataToUpdate.rating = updateData.rating;
  if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
  if (updateData.comment !== undefined) dataToUpdate.comment = updateData.comment;
  if (updateData.images !== undefined) dataToUpdate.images = updateData.images as any;

  // Update review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: dataToUpdate,
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  // Update product rating
  await updateProductRating(existingReview.productId);

  return updatedReview;
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId: string, userId: string) => {
  // Check if review exists and belongs to user
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.userId !== userId) {
    throw new AppError('You can only delete your own reviews', 403);
  }

  const productId = review.productId;

  // Delete review
  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Update product rating
  await updateProductRating(productId);

  return { message: 'Review deleted successfully' };
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Increment helpful count
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      helpfulCount: {
        increment: 1,
      },
    },
  });

  return updatedReview;
};

/**
 * Get user's reviews
 */
export const getUserReviews = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews;
};

/**
 * Helper: Update product rating and review count
 * UPDATED: Uses 'reviewCount' instead of 'reviews'
 */
const updateProductRating = async (productId: string) => {
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: stats._avg.rating || null,
      reviewCount: stats._count.rating || 0, // ← CHANGED from 'reviews' to 'reviewCount'
    },
  });
};

/**
 * Get all reviews (Admin)
 */
export const getAllReviews = async (filters?: {
  productId?: string;
  userId?: string;
  rating?: number;
  page?: number;
  limit?: number;
}) => {
  const { productId, userId, rating, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  const where: any = {};
  if (productId) where.productId = productId;
  if (userId) where.userId = userId;
  if (rating) where.rating = rating;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
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
    },
  };
};

/**
 * Delete review (Admin)
 */
export const deleteReviewAdmin = async (reviewId: string) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const productId = review.productId;

  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Update product rating
  await updateProductRating(productId);

  return { message: 'Review deleted successfully' };
};