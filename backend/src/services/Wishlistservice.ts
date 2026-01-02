import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

// ============================================
// TYPED ERRORS
// ============================================
export class WishlistItemNotFoundError extends AppError {
  constructor(message: string = 'Product not in wishlist') {
    super(message, 404);
    this.name = 'NOT_FOUND';
  }
}

export class DuplicateWishlistItemError extends AppError {
  constructor(message: string = 'Product already in wishlist') {
    super(message, 400);
    this.name = 'DUPLICATE_ITEM';
  }
}

export class ProductNotFoundError extends AppError {
  constructor(message: string = 'Product not found') {
    super(message, 404);
    this.name = 'PRODUCT_NOT_FOUND';
  }
}

// ============================================
// INTERFACES
// ============================================
interface WishlistFilters {
  page?: number;
  limit?: number;
}

interface MoveToCartResult {
  added: string[];
  failed: Array<{ productId: string; reason: string }>;
}

// ============================================
// GET USER'S WISHLIST
// ============================================
/**
 * Get user's wishlist with pagination support
 * Returns products with full details including stock and rating
 */
export const getUserWishlist = async (
  userId: string,
  filters?: WishlistFilters
) => {
  const { page, limit } = filters || {};

  try {
    // Build query options
    const queryOptions: any = {
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            stock: true,
            image: true,
            images: true,
            rating: true,
            reviewCount: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    };

    // Add pagination if provided
    if (page && limit) {
      const skip = (page - 1) * limit;
      queryOptions.skip = skip;
      queryOptions.take = limit;
    }

    const wishlistItems = await prisma.wishlist.findMany(queryOptions);

    // If pagination requested, also get total count
    if (page && limit) {
      const total = await prisma.wishlist.count({ where: { userId } });
      
      return {
        items: wishlistItems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    }

    return wishlistItems;
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    throw new AppError('Failed to fetch wishlist', 500);
  }
};

// ============================================
// ADD PRODUCT TO WISHLIST
// ============================================
/**
 * Add product to user's wishlist
 * Prevents duplicate entries using unique constraint
 */
export const addToWishlist = async (userId: string, productId: string) => {
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        stock: true,
        image: true,
        images: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      throw new DuplicateWishlistItemError();
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            stock: true,
            image: true,
            images: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return wishlistItem;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to add to wishlist:', error);
    throw new AppError('Failed to add to wishlist', 500);
  }
};

// ============================================
// REMOVE PRODUCT FROM WISHLIST
// ============================================
/**
 * Remove product from user's wishlist
 */
export const removeFromWishlist = async (userId: string, productId: string) => {
  try {
    // Check if item exists in wishlist
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingItem) {
      throw new WishlistItemNotFoundError();
    }

    // Remove from wishlist
    await prisma.wishlist.delete({
      where: {
        id: existingItem.id,
      },
    });

    return { message: 'Product removed from wishlist' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Failed to remove from wishlist:', error);
    throw new AppError('Failed to remove from wishlist', 500);
  }
};

// ============================================
// CHECK IF PRODUCT IS IN WISHLIST
// ============================================
/**
 * Check if product is in user's wishlist
 * Useful for UI to show wishlist status
 */
export const isInWishlist = async (userId: string, productId: string) => {
  try {
    const item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      select: {
        id: true,
      },
    });

    return { inWishlist: !!item };
  } catch (error) {
    console.error('Failed to check wishlist status:', error);
    throw new AppError('Failed to check wishlist status', 500);
  }
};

// ============================================
// CLEAR ENTIRE WISHLIST
// ============================================
/**
 * Clear all items from user's wishlist
 */
export const clearWishlist = async (userId: string) => {
  try {
    const result = await prisma.wishlist.deleteMany({
      where: { userId },
    });

    return {
      message: 'Wishlist cleared successfully',
      deletedCount: result.count,
    };
  } catch (error) {
    console.error('Failed to clear wishlist:', error);
    throw new AppError('Failed to clear wishlist', 500);
  }
};

// ============================================
// GET WISHLIST COUNT
// ============================================
/**
 * Get total count of items in user's wishlist
 * Useful for displaying badge count in UI
 */
export const getWishlistCount = async (userId: string) => {
  try {
    const count = await prisma.wishlist.count({
      where: { userId },
    });

    return { count };
  } catch (error) {
    console.error('Failed to get wishlist count:', error);
    throw new AppError('Failed to get wishlist count', 500);
  }
};

// ============================================
// MOVE WISHLIST ITEMS TO CART
// ============================================
/**
 * Move multiple wishlist items to cart (bulk operation)
 * Returns success/failure for each item
 */
export const moveWishlistToCart = async (
  userId: string,
  productIds: string[]
): Promise<MoveToCartResult> => {
  const results: MoveToCartResult = {
    added: [],
    failed: [],
  };

  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs array is required and cannot be empty', 400);
  }

  // Process each product
  for (const productId of productIds) {
    try {
      // Check if product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          stock: true,
        },
      });

      if (!product) {
        results.failed.push({
          productId,
          reason: 'Product not found',
        });
        continue;
      }

      if (!product.stock || product.stock === 0) {
        results.failed.push({
          productId,
          reason: 'Out of stock',
        });
        continue;
      }

      // Get or create cart
      let cart = await prisma.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
        });
      }

      // Check if already in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existingCartItem) {
        // Update quantity (increment by 1)
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + 1,
          },
        });
      } else {
        // Add to cart
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity: 1,
          },
        });
      }

      // Remove from wishlist
      await prisma.wishlist.deleteMany({
        where: {
          userId,
          productId,
        },
      });

      results.added.push(productId);
    } catch (error) {
      console.error(`Failed to move product ${productId} to cart:`, error);
      results.failed.push({
        productId,
        reason: 'Failed to add to cart',
      });
    }
  }

  return results;
};

// ============================================
// BULK ADD TO WISHLIST
// ============================================
/**
 * Add multiple products to wishlist at once
 * Returns success/failure for each item
 */
export const bulkAddToWishlist = async (
  userId: string,
  productIds: string[]
) => {
  const results = {
    added: [] as string[],
    failed: [] as Array<{ productId: string; reason: string }>,
  };

  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs array is required and cannot be empty', 400);
  }

  for (const productId of productIds) {
    try {
      await addToWishlist(userId, productId);
      results.added.push(productId);
    } catch (error) {
      let reason = 'Failed to add';
      
      if (error instanceof DuplicateWishlistItemError) {
        reason = 'Already in wishlist';
      } else if (error instanceof ProductNotFoundError) {
        reason = 'Product not found';
      }

      results.failed.push({ productId, reason });
    }
  }

  return results;
};

// ============================================
// BULK REMOVE FROM WISHLIST
// ============================================
/**
 * Remove multiple products from wishlist at once
 */
export const bulkRemoveFromWishlist = async (
  userId: string,
  productIds: string[]
) => {
  // Validate input
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs array is required and cannot be empty', 400);
  }

  try {
    const result = await prisma.wishlist.deleteMany({
      where: {
        userId,
        productId: {
          in: productIds,
        },
      },
    });

    return {
      message: `${result.count} items removed from wishlist`,
      deletedCount: result.count,
    };
  } catch (error) {
    console.error('Failed to bulk remove from wishlist:', error);
    throw new AppError('Failed to remove items from wishlist', 500);
  }
};