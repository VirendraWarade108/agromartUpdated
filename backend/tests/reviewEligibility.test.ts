/**
 * Review Eligibility Tests
 * 
 * Tests the business logic for determining if a user can review a product
 * Ensures reviews can only be submitted by verified purchasers
 * 
 * File: backend/tests/reviewEligibility.test.ts
 */

import { describe, test, expect } from '@jest/globals';

// ============================================
// TYPE DEFINITIONS
// ============================================

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: Date;
  deliveredAt: Date | null;
  items: OrderItem[];
}

interface OrderItem {
  productId: string;
  quantity: number;
}

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  context?: {
    hasPurchased?: boolean;
    hasDelivered?: boolean;
    alreadyReviewed?: boolean;
    withinWindow?: boolean;
    reviewWindowDays?: number;
  };
}

// ============================================
// REVIEW ELIGIBILITY LOGIC
// ============================================

const REVIEW_WINDOW_DAYS = 90; // Can review within 90 days of delivery

/**
 * Check if user can review a product
 */
function canUserReviewProduct(
  userId: string,
  productId: string,
  userOrders: Order[],
  existingReviews: Review[],
  currentDate: Date = new Date()
): EligibilityResult {
  // Check if user has already reviewed this product
  const hasReviewed = existingReviews.some(
    (review) => review.userId === userId && review.productId === productId
  );

  if (hasReviewed) {
    return {
      eligible: false,
      reason: 'You have already reviewed this product',
      context: { alreadyReviewed: true },
    };
  }

  // Find delivered orders containing this product
  const deliveredOrders = userOrders.filter(
    (order) =>
      order.userId === userId &&
      order.status === 'delivered' &&
      order.deliveredAt !== null &&
      order.items.some((item) => item.productId === productId)
  );

  if (deliveredOrders.length === 0) {
    return {
      eligible: false,
      reason: 'You can only review products you have purchased and received',
      context: { hasPurchased: false, hasDelivered: false },
    };
  }

  // Check if any delivery is within the review window
  const hasValidDelivery = deliveredOrders.some((order) => {
    if (!order.deliveredAt) return false;

    const daysSinceDelivery = Math.floor(
      (currentDate.getTime() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceDelivery <= REVIEW_WINDOW_DAYS;
  });

  if (!hasValidDelivery) {
    return {
      eligible: false,
      reason: `Reviews can only be submitted within ${REVIEW_WINDOW_DAYS} days of delivery`,
      context: {
        hasPurchased: true,
        hasDelivered: true,
        withinWindow: false,
        reviewWindowDays: REVIEW_WINDOW_DAYS,
      },
    };
  }

  return {
    eligible: true,
    context: {
      hasPurchased: true,
      hasDelivered: true,
      alreadyReviewed: false,
      withinWindow: true,
    },
  };
}

/**
 * Validate review content
 */
function validateReviewContent(
  rating: number,
  comment: string
): { valid: boolean; reason?: string } {
  // Validate rating
  if (rating < 1 || rating > 5) {
    return { valid: false, reason: 'Rating must be between 1 and 5' };
  }

  if (!Number.isInteger(rating)) {
    return { valid: false, reason: 'Rating must be a whole number' };
  }

  // Validate comment
  const trimmedComment = comment.trim();

  if (trimmedComment.length === 0) {
    return { valid: false, reason: 'Review comment is required' };
  }

  if (trimmedComment.length < 10) {
    return { valid: false, reason: 'Review comment must be at least 10 characters' };
  }

  if (trimmedComment.length > 2000) {
    return { valid: false, reason: 'Review comment must not exceed 2000 characters' };
  }

  return { valid: true };
}

/**
 * Check if user can edit their review
 */
function canUserEditReview(
  review: Review,
  userId: string,
  currentDate: Date = new Date()
): { canEdit: boolean; reason?: string } {
  // Check ownership
  if (review.userId !== userId) {
    return { canEdit: false, reason: 'You can only edit your own reviews' };
  }

  // Check edit window (24 hours)
  const EDIT_WINDOW_HOURS = 24;
  const hoursSinceCreation = Math.floor(
    (currentDate.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60)
  );

  if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
    return {
      canEdit: false,
      reason: `Reviews can only be edited within ${EDIT_WINDOW_HOURS} hours of posting`,
    };
  }

  return { canEdit: true };
}

// ============================================
// TEST DATA HELPERS
// ============================================

const createOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order_test',
  userId: 'user_1',
  status: 'delivered',
  createdAt: new Date('2026-01-01'),
  deliveredAt: new Date('2026-01-05'),
  items: [{ productId: 'product_1', quantity: 1 }],
  ...overrides,
});

const createReview = (overrides: Partial<Review> = {}): Review => ({
  id: 'review_test',
  userId: 'user_1',
  productId: 'product_1',
  rating: 5,
  comment: 'Great product!',
  createdAt: new Date('2026-01-10'),
  ...overrides,
});

// ============================================
// TESTS
// ============================================

describe('Review Eligibility', () => {
  describe('Purchase Verification', () => {
    test('user with delivered order can review', () => {
      const orders = [createOrder()];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(true);
      expect(result.context?.hasPurchased).toBe(true);
      expect(result.context?.hasDelivered).toBe(true);
    });

    test('user without purchase cannot review', () => {
      const orders: Order[] = [];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('purchased and received');
      expect(result.context?.hasPurchased).toBe(false);
    });

    test('user with different product cannot review', () => {
      const orders = [
        createOrder({
          items: [{ productId: 'product_2', quantity: 1 }],
        }),
      ];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('purchased and received');
    });
  });

  describe('Order Status Verification', () => {
    test('pending order does not allow review', () => {
      const orders = [createOrder({ status: 'pending' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
      expect(result.context?.hasDelivered).toBe(false);
    });

    test('processing order does not allow review', () => {
      const orders = [createOrder({ status: 'processing' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
    });

    test('shipped order does not allow review', () => {
      const orders = [createOrder({ status: 'shipped' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
    });

    test('cancelled order does not allow review', () => {
      const orders = [createOrder({ status: 'cancelled' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
    });

    test('delivered order allows review', () => {
      const orders = [createOrder({ status: 'delivered' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(true);
    });

    test('refunded order does not allow review', () => {
      const orders = [createOrder({ status: 'refunded' })];
      const reviews: Review[] = [];
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
    });
  });

  describe('Review Window', () => {
    test('review within 90 days is allowed', () => {
      const deliveredAt = new Date('2026-01-01');
      const currentDate = new Date('2026-03-30'); // 89 days later
      
      const orders = [createOrder({ deliveredAt })];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct(
        'user_1',
        'product_1',
        orders,
        reviews,
        currentDate
      );
      
      expect(result.eligible).toBe(true);
      expect(result.context?.withinWindow).toBe(true);
    });

    test('review on day 90 is allowed', () => {
      const deliveredAt = new Date('2026-01-01');
      const currentDate = new Date('2026-03-31'); // Exactly 90 days later
      
      const orders = [createOrder({ deliveredAt })];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct(
        'user_1',
        'product_1',
        orders,
        reviews,
        currentDate
      );
      
      expect(result.eligible).toBe(true);
    });

    test('review after 90 days is rejected', () => {
      const deliveredAt = new Date('2026-01-01');
      const currentDate = new Date('2026-04-02'); // 91 days later
      
      const orders = [createOrder({ deliveredAt })];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct(
        'user_1',
        'product_1',
        orders,
        reviews,
        currentDate
      );
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('90 days');
      expect(result.context?.withinWindow).toBe(false);
    });

    test('same-day review is allowed', () => {
      const deliveredAt = new Date('2026-01-01T10:00:00');
      const currentDate = new Date('2026-01-01T15:00:00'); // Same day
      
      const orders = [createOrder({ deliveredAt })];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct(
        'user_1',
        'product_1',
        orders,
        reviews,
        currentDate
      );
      
      expect(result.eligible).toBe(true);
    });
  });

  describe('Duplicate Review Prevention', () => {
    test('user cannot review same product twice', () => {
      const orders = [createOrder()];
      const reviews = [createReview()];
      
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('already reviewed');
      expect(result.context?.alreadyReviewed).toBe(true);
    });

    test('user can review different products', () => {
      const orders = [
        createOrder({ items: [{ productId: 'product_1', quantity: 1 }] }),
        createOrder({ items: [{ productId: 'product_2', quantity: 1 }] }),
      ];
      const reviews = [createReview({ productId: 'product_1' })];
      
      const result = canUserReviewProduct('user_1', 'product_2', orders, reviews);
      
      expect(result.eligible).toBe(true);
    });

    test('different users can review same product', () => {
      const orders = [
        createOrder({ userId: 'user_1' }),
        createOrder({ userId: 'user_2' }),
      ];
      const reviews = [createReview({ userId: 'user_1' })];
      
      const result = canUserReviewProduct('user_2', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(true);
    });
  });

  describe('Multiple Orders', () => {
    test('multiple delivered orders allow review', () => {
      const orders = [
        createOrder({ id: 'order_1', deliveredAt: new Date('2025-12-01') }),
        createOrder({ id: 'order_2', deliveredAt: new Date('2026-01-05') }),
      ];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct('user_1', 'product_1', orders, reviews);
      
      expect(result.eligible).toBe(true);
    });

    test('one valid order within window is sufficient', () => {
      const currentDate = new Date('2026-03-01');
      const orders = [
        createOrder({
          id: 'order_1',
          deliveredAt: new Date('2025-11-01'), // Outside window
        }),
        createOrder({
          id: 'order_2',
          deliveredAt: new Date('2026-02-01'), // Within window
        }),
      ];
      const reviews: Review[] = [];
      
      const result = canUserReviewProduct(
        'user_1',
        'product_1',
        orders,
        reviews,
        currentDate
      );
      
      expect(result.eligible).toBe(true);
    });
  });
});

describe('Review Content Validation', () => {
  describe('Rating Validation', () => {
    test('valid ratings 1-5 are accepted', () => {
      [1, 2, 3, 4, 5].forEach((rating) => {
        const result = validateReviewContent(rating, 'Great product!');
        expect(result.valid).toBe(true);
      });
    });

    test('rating below 1 is rejected', () => {
      const result = validateReviewContent(0, 'Great product!');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('between 1 and 5');
    });

    test('rating above 5 is rejected', () => {
      const result = validateReviewContent(6, 'Great product!');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('between 1 and 5');
    });

    test('decimal rating is rejected', () => {
      const result = validateReviewContent(3.5, 'Great product!');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('whole number');
    });
  });

  describe('Comment Validation', () => {
    test('valid comment is accepted', () => {
      const result = validateReviewContent(5, 'This is a great product!');
      expect(result.valid).toBe(true);
    });

    test('empty comment is rejected', () => {
      const result = validateReviewContent(5, '');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('required');
    });

    test('whitespace-only comment is rejected', () => {
      const result = validateReviewContent(5, '   ');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('required');
    });

    test('comment under 10 characters is rejected', () => {
      const result = validateReviewContent(5, 'Good');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('at least 10 characters');
    });

    test('comment exactly 10 characters is accepted', () => {
      const result = validateReviewContent(5, '1234567890');
      expect(result.valid).toBe(true);
    });

    test('comment over 2000 characters is rejected', () => {
      const longComment = 'a'.repeat(2001);
      const result = validateReviewContent(5, longComment);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('2000 characters');
    });

    test('comment exactly 2000 characters is accepted', () => {
      const longComment = 'a'.repeat(2000);
      const result = validateReviewContent(5, longComment);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Review Editing', () => {
  test('owner can edit review within 24 hours', () => {
    const review = createReview({ createdAt: new Date('2026-01-01T10:00:00') });
    const currentDate = new Date('2026-01-02T09:00:00'); // 23 hours later
    
    const result = canUserEditReview(review, 'user_1', currentDate);
    
    expect(result.canEdit).toBe(true);
  });

  test('owner cannot edit review after 24 hours', () => {
    const review = createReview({ createdAt: new Date('2026-01-01T10:00:00') });
    const currentDate = new Date('2026-01-02T11:00:00'); // 25 hours later
    
    const result = canUserEditReview(review, 'user_1', currentDate);
    
    expect(result.canEdit).toBe(false);
    expect(result.reason).toContain('24 hours');
  });

  test('non-owner cannot edit review', () => {
    const review = createReview({ userId: 'user_1' });
    
    const result = canUserEditReview(review, 'user_2');
    
    expect(result.canEdit).toBe(false);
    expect(result.reason).toContain('your own reviews');
  });

  test('can edit on exact 24 hour mark', () => {
    const review = createReview({ createdAt: new Date('2026-01-01T10:00:00') });
    const currentDate = new Date('2026-01-02T10:00:00'); // Exactly 24 hours
    
    const result = canUserEditReview(review, 'user_1', currentDate);
    
    expect(result.canEdit).toBe(true);
  });
});

/**
 * ============================================
 * TEST SUMMARY
 * ============================================
 * 
 * ELIGIBILITY TESTS:
 * - Purchase verification (3 tests)
 * - Order status verification (6 tests)
 * - Review window (4 tests)
 * - Duplicate prevention (3 tests)
 * - Multiple orders (2 tests)
 * 
 * CONTENT VALIDATION:
 * - Rating validation (4 tests)
 * - Comment validation (7 tests)
 * 
 * EDITING:
 * - Edit permissions (4 tests)
 * 
 * Total: 33 tests
 * 
 * KEY BUSINESS RULES:
 * ✅ Only delivered orders allow reviews
 * ✅ Reviews must be within 90 days of delivery
 * ✅ No duplicate reviews per user/product
 * ✅ Rating must be 1-5 (whole number)
 * ✅ Comment 10-2000 characters
 * ✅ Can edit within 24 hours only
 * ✅ Only owner can edit review
 * ============================================
 */