import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get user's wishlist
 */
export const getUserWishlist = async (userId: string) => {
  const wishlistItems = await prisma.wishlist.findMany({
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
          images: true,
          rating: true,
          reviews: true,
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
  });

  return wishlistItems;
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (userId: string, productId: string) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
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
    throw new AppError('Product already in wishlist', 400);
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
          images: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return wishlistItem;
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (userId: string, productId: string) => {
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
    throw new AppError('Product not in wishlist', 404);
  }

  // Remove from wishlist
  await prisma.wishlist.delete({
    where: {
      id: existingItem.id,
    },
  });

  return { message: 'Product removed from wishlist' };
};

/**
 * Check if product is in user's wishlist
 */
export const isInWishlist = async (userId: string, productId: string) => {
  const item = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  return { inWishlist: !!item };
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = async (userId: string) => {
  const result = await prisma.wishlist.deleteMany({
    where: { userId },
  });

  return {
    message: 'Wishlist cleared',
    deletedCount: result.count,
  };
};

/**
 * Get wishlist count
 */
export const getWishlistCount = async (userId: string) => {
  const count = await prisma.wishlist.count({
    where: { userId },
  });

  return { count };
};

/**
 * Move wishlist items to cart (bulk operation)
 */
export const moveWishlistToCart = async (userId: string, productIds: string[]) => {
  const results = {
    added: [] as string[],
    failed: [] as { productId: string; reason: string }[],
  };

  for (const productId of productIds) {
    try {
      // Check if product exists and has stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        results.failed.push({ productId, reason: 'Product not found' });
        continue;
      }

      if (product.stock === 0) {
        results.failed.push({ productId, reason: 'Out of stock' });
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
        // Update quantity
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
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
      results.failed.push({
        productId,
        reason: 'Failed to add to cart',
      });
    }
  }

  return results;
};