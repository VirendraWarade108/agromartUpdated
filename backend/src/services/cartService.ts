import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as couponService from './couponService';

/**
 * Get user's cart with all items
 */
export const getCart = async (userId: string) => {
  // Find or create cart for user
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              image: true,
              stock: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Create cart if doesn't exist
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                originalPrice: true,
                image: true,
                stock: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Transform response to match frontend expectations
  const transformedCart = {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        thumbnail: item.product.image,
        inStock: (item.product.stock || 0) > 0,
        category: item.product.category?.name || 'Uncategorized',
      },
      price: item.product.price,
    })),
  };

  return transformedCart;
};

/**
 * Get guest cart by cartId
 */
export const getGuestCart = async (guestCartId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { id: guestCartId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              image: true,
              stock: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    throw new AppError('Guest cart not found', 404);
  }

  // Transform response
  const transformedCart = {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        thumbnail: item.product.image,
        inStock: (item.product.stock || 0) > 0,
        category: item.product.category?.name || 'Uncategorized',
      },
      price: item.product.price,
    })),
  };

  return transformedCart;
};

/**
 * Create guest cart
 */
export const createGuestCart = async () => {
  const cart = await prisma.cart.create({
    data: {
      userId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              originalPrice: true,
              image: true,
              stock: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return cart;
};

/**
 * Merge guest cart into user cart on login
 */
export const mergeGuestCart = async (userId: string, guestCartId: string) => {
  // Get both carts
  const [userCart, guestCart] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    }),
    prisma.cart.findUnique({
      where: { id: guestCartId },
      include: { items: true },
    }),
  ]);

  if (!guestCart || !guestCart.items.length) {
    // No guest cart or empty, nothing to merge
    return userCart || (await prisma.cart.create({ data: { userId } }));
  }

  // Ensure user has a cart
  let targetCart = userCart;
  if (!targetCart) {
    targetCart = await prisma.cart.create({
      data: { userId },
    });
  }

  // Merge items from guest cart
  for (const guestItem of guestCart.items) {
    // Check if product exists in user cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: targetCart.id,
          productId: guestItem.productId,
        },
      },
      include: { product: true },
    });

    if (existingItem) {
      // Product already exists, add quantities
      const newQuantity = existingItem.quantity + guestItem.quantity;
      const maxQuantity = Math.min(newQuantity, existingItem.product.stock || 0, 50);

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: maxQuantity },
      });
    } else {
      // Product doesn't exist, add new item
      const product = await prisma.product.findUnique({
        where: { id: guestItem.productId },
      });

      if (product && product.stock && product.stock > 0) {
        const maxQuantity = Math.min(guestItem.quantity, product.stock, 50);

        await prisma.cartItem.create({
          data: {
            cartId: targetCart.id,
            productId: guestItem.productId,
            quantity: maxQuantity,
          },
        });
      }
    }
  }

  // Delete guest cart and its items
  await prisma.cart.delete({
    where: { id: guestCartId },
  });

  // Return merged cart
  return getCart(userId);
};

/**
 * Add product to cart
 */
export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number = 1
) => {
  // Validate quantity
  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  // Check if product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.stock || product.stock < quantity) {
    throw new AppError('Product out of stock', 400);
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

  // Check if product already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;

    if (product.stock < newQuantity) {
      throw new AppError('Not enough stock available', 400);
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  // Return updated cart
  return getCart(userId);
};

/**
 * Update cart item quantity by cart item ID
 */
export const updateCartItem = async (
  userId: string,
  cartItemId: string,
  quantity: number
) => {
  // Validate quantity
  if (quantity < 0) {
    throw new AppError('Quantity cannot be negative', 400);
  }

  // If quantity is 0, remove item
  if (quantity === 0) {
    return removeFromCart(userId, cartItemId);
  }

  // Get cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Find cart item by ID
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true },
  });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new AppError('Item not in cart', 404);
  }

  // Check stock
  if (!cartItem.product.stock || cartItem.product.stock < quantity) {
    throw new AppError('Not enough stock available', 400);
  }

  // Update quantity
  await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity },
  });

  // Return updated cart
  return getCart(userId);
};

/**
 * Remove item from cart by cart item ID
 */
export const removeFromCart = async (userId: string, cartItemId: string) => {
  // Get cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Verify item belongs to user's cart
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
  });

  if (!cartItem || cartItem.cartId !== cart.id) {
    throw new AppError('Item not in cart', 404);
  }

  // Delete item
  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  // Return updated cart
  return getCart(userId);
};

/**
 * Clear entire cart
 */
export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // Delete all items
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return getCart(userId);
};

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (cart: any, discountAmount: number = 0) => {
  let subtotal = 0;

  cart.items.forEach((item: any) => {
    subtotal += item.product.price * item.quantity;
  });

  const total = Math.max(0, subtotal - discountAmount);

  return {
    subtotal,
    discount: discountAmount,
    total,
  };
};

/**
 * Apply coupon to cart
 */
export const applyCouponToCart = async (userId: string, couponCode: string) => {
  // Get cart
  const cart = await getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Calculate subtotal
  const totals = calculateCartTotals(cart, 0);

  // Validate coupon
  const result = await couponService.validateCoupon(couponCode, totals.subtotal);

  return {
    cart,
    coupon: result.coupon,
    discountAmount: result.discountAmount,
    totals: calculateCartTotals(cart, result.discountAmount),
  };
};

/**
 * Remove coupon from cart
 */
export const removeCouponFromCart = async (userId: string) => {
  const cart = await getCart(userId);
  const totals = calculateCartTotals(cart, 0);

  return {
    cart,
    coupon: null,
    discountAmount: 0,
    totals,
  };
};

/**
 * Sync cart with server (merge local and server carts)
 */
export const syncCart = async (userId: string, localItems: any[]) => {
  // Get or create server cart
  const serverCart = await getCart(userId);

  // Merge logic: for each local item, add/update in server cart
  for (const localItem of localItems) {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: localItem.productId },
      });

      if (!product || !product.stock || product.stock < 1) {
        continue;
      }

      // Find existing cart item
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: serverCart.id,
            productId: localItem.productId,
          },
        },
      });

      if (existingItem) {
        // Update to higher quantity
        const newQuantity = Math.max(existingItem.quantity, localItem.quantity);
        const cappedQuantity = Math.min(newQuantity, product.stock, 50);

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: cappedQuantity },
        });
      } else {
        // Add new item from local cart
        const cappedQuantity = Math.min(localItem.quantity, product.stock, 50);

        await prisma.cartItem.create({
          data: {
            cartId: serverCart.id,
            productId: localItem.productId,
            quantity: cappedQuantity,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to sync item ${localItem.productId}:`, error);
    }
  }

  // Return merged cart
  return getCart(userId);
};

/**
 * Validate cart stock atomically before checkout
 */
export const validateCartStock = async (userId: string): Promise<boolean> => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || !cart.items.length) {
    throw new AppError('Cart is empty', 400);
  }

  // Check each item
  for (const item of cart.items) {
    if (!item.product.stock || item.product.stock < item.quantity) {
      throw new AppError(
        `Product "${item.product.name}" has insufficient stock (requested: ${item.quantity}, available: ${item.product.stock || 0})`,
        400
      );
    }
  }

  return true;
};