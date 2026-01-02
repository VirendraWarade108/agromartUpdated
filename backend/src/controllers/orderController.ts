import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as cartService from '../services/cartService';
import * as orderService from '../services/orderService';
import * as orderTrackingService from '../services/orderTrackingService';

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const cart = await cartService.getCart(userId);

  res.json({
    success: true,
    data: {
      items: cart.items,
      coupon: null,
    },
  });
});

/**
 * Add item to cart
 * POST /api/cart/add
 */
export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required',
    });
  }

  const cart = await cartService.addToCart(userId, productId, quantity);

  res.json({
    success: true,
    message: 'Item added to cart',
    data: {
      items: cart.items,
      coupon: null,
    },
  });
});

/**
 * Update cart item quantity
 * PUT /api/cart/items/:id
 */
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required',
      });
    }

    const cart = await cartService.updateCartItem(userId, id, quantity);

    res.json({
      success: true,
      message: 'Cart updated',
      data: {
        items: cart.items,
        coupon: null,
      },
    });
  }
);

/**
 * Remove item from cart
 * DELETE /api/cart/items/:id
 */
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const cart = await cartService.removeFromCart(userId, id);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        items: cart.items,
        coupon: null,
      },
    });
  }
);

/**
 * Clear cart
 * DELETE /api/cart
 */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const cart = await cartService.clearCart(userId);

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      items: cart.items,
      coupon: null,
    },
  });
});

/**
 * Apply coupon to cart
 * POST /api/cart/coupon
 */
export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Coupon code is required',
    });
  }

  const result = await cartService.applyCouponToCart(userId, code);

  res.json({
    success: true,
    message: 'Coupon applied successfully',
    data: {
      items: result.cart.items,
      coupon: {
        code: result.coupon.code,
        discount: result.discountAmount,
      },
      totals: result.totals,
    },
  });
});

/**
 * Remove coupon from cart
 * DELETE /api/cart/coupon
 */
export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const result = await cartService.removeCouponFromCart(userId);

  res.json({
    success: true,
    message: 'Coupon removed',
    data: {
      items: result.cart.items,
      coupon: null,
      totals: result.totals,
    },
  });
});

/**
 * Sync cart with server
 * POST /api/cart/sync
 */
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'Items array is required',
    });
  }

  const cart = await cartService.syncCart(userId, items);

  res.json({
    success: true,
    message: 'Cart synced successfully',
    data: {
      items: cart.items,
      coupon: null,
    },
  });
});

/**
 * Create order (Checkout)
 * POST /api/checkout
 */
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  const order = await orderService.createOrder(userId, {
    shippingAddress,
    paymentMethod,
    couponCode,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});

/**
 * Get user's orders
 * GET /api/orders
 */
export const getUserOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page, limit, status } = req.query;

    const result = await orderService.getUserOrders(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  }
);

/**
 * Get single order
 * GET /api/orders/:id
 */
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const order = await orderService.getOrderById(id, userId);

    res.json({
      success: true,
      data: order,
    });
  }
);

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const order = await orderService.cancelOrder(id, userId);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

/**
 * Refund order (Admin only)
 * POST /api/orders/:id/refund
 */
export const refundOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  const result = await orderService.refundOrder(id, amount);

  res.json({
    success: true,
    message: 'Order refunded successfully',
    data: result,
  });
});

/**
 * Get order tracking
 * GET /api/orders/:id/track
 */
export const getOrderTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const tracking = await orderTrackingService.getOrderTracking(id, userId);

    res.json({
      success: true,
      data: tracking,
    });
  }
);

/**
 * Get order invoice
 * GET /api/orders/:id/invoice
 */
export const getOrderInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await orderService.getOrderInvoice(id, userId);

    res.json({
      success: true,
      data: invoice,
    });
  }
);

/**
 * Get all orders (Admin only)
 * GET /api/admin/orders
 */
export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, status } = req.query;

    const result = await orderService.getAllOrders({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  }
);

/**
 * Update order status (Admin only)
 * PUT /api/admin/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await orderService.updateOrderStatus(id, status);

    res.json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  }
);