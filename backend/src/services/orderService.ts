import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getCart, clearCart, calculateCartTotals, validateCartStock } from './cartService';
import * as couponService from './couponService';
import * as productService from './productService';
import * as orderTrackingService from './orderTrackingService';
import { OrderStatus } from '../validators/order';

/**
 * Canonical order status transition rules
 * Enforces valid state machine transitions
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled', 'failed'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [], // terminal state
  refunded: [], // terminal state
  failed: ['cancelled'],
};

/**
 * Validates if a status transition is allowed
 * @param fromStatus - Current order status
 * @param toStatus - Desired new status
 * @returns true if transition is valid, false otherwise
 */
const isValidOrderTransition = (fromStatus: OrderStatus, toStatus: OrderStatus): boolean => {
  // Allow transitions to same status (idempotent updates)
  if (fromStatus === toStatus) {
    return true;
  }

  const allowedTransitions = VALID_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
};

/**
 * Calculate shipping fee
 */
const calculateShipping = (subtotal: number): number => {
  const FREE_SHIPPING_THRESHOLD = 5000;
  const STANDARD_SHIPPING_FEE = 200;
  
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
};

/**
 * Calculate tax (18% GST)
 */
const calculateTax = (subtotal: number, discount: number): number => {
  const GST_RATE = 0.18;
  const taxableAmount = subtotal - discount;
  return Math.round(taxableAmount * GST_RATE * 100) / 100;
};

/**
 * Order Totals Interface
 */
interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  couponData?: {
    code: string;
    type: string;
    value: number;
    discount: number;
  };
  couponId?: string;
}

/**
 * Calculate order totals with full backend authority
 * This is the single source of truth for all pricing calculations
 * 
 * @param cartItems - Cart items with products from database
 * @param couponCode - Optional coupon code to apply
 * @returns Normalized order totals object
 */
const calculateOrderTotals = async (
  cartItems: Array<{
    productId: string;
    quantity: number;
    product: {
      price: number;
    };
  }>,
  couponCode?: string
): Promise<OrderTotals> => {
  // Calculate subtotal from DATABASE product prices (never trust client)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Apply coupon discount if provided and valid
  let discount = 0;
  let couponData: any = undefined;
  let couponId: string | undefined = undefined;

  if (couponCode) {
    try {
      // Validate coupon with current subtotal
      const couponResult = await couponService.validateCoupon(
        couponCode,
        subtotal
      );

      discount = couponResult.discountAmount;
      couponId = couponResult.coupon.id;

      couponData = {
        code: couponResult.coupon.code,
        type: couponResult.coupon.type,
        value: couponResult.coupon.value,
        discount: discount,
      };
    } catch (error: any) {
      // Re-throw coupon validation errors
      throw new AppError(error.message || 'Invalid coupon', 400);
    }
  }

  // Calculate shipping based on subtotal (before discount)
  const shipping = calculateShipping(subtotal);

  // Calculate tax on (subtotal - discount)
  const tax = calculateTax(subtotal, discount);

  // Calculate final total
  const total = subtotal - discount + shipping + tax;

  return {
    subtotal,
    discount,
    tax,
    shipping,
    total,
    couponData,
    couponId,
  };
};

/**
 * Create order from cart (Checkout)
 * Stock is decremented here atomically - NOT in payment webhooks
 */
export const createOrder = async (
  userId: string,
  data: {
    shippingAddress?: any;
    paymentMethod?: string;
    couponCode?: string;
  }
) => {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Get user's cart
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Validate and reserve stock atomically
    for (const item of cart.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (!product.stock || product.stock < item.quantity) {
        throw new AppError(
          `Product "${product.name}" has insufficient stock (requested: ${item.quantity}, available: ${product.stock || 0})`,
          400
        );
      }

      // Decrement stock immediately during order creation
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Calculate order totals with backend authority
    // This is the ONLY place where pricing is determined
    const totals = await calculateOrderTotals(cart.items, data.couponCode);

    // Create order with canonical status and calculated totals
    const order = await tx.order.create({
      data: {
        userId,
        total: totals.total,
        status: 'pending' as OrderStatus,
        ...(totals.couponData && { coupon: totals.couponData }),
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Use DB price, not client price
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // Increment coupon usage if coupon was applied
    if (totals.couponId) {
      await couponService.applyCoupon(totals.couponId);
    }

    // Create initial tracking entry
    await tx.orderTracking.create({
      data: {
        orderId: order.id,
        status: 'pending' as OrderStatus,
        description: 'Order placed successfully',
      },
    });

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });
};

/**
 * Get user's orders
 */
export const getUserOrders = async (
  userId: string,
  options: { page?: number; limit?: number; status?: OrderStatus } = {}
) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              price: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (userId && order.userId !== userId) {
    throw new AppError('Unauthorized to view this order', 403);
  }

  return order;
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (options: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
} = {}) => {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update order status (Admin only)
 * Enforces state machine transitions
 */
export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const validStatuses: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];

  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Enforce state machine transition rules
  if (!isValidOrderTransition(order.status as OrderStatus, status)) {
    throw new AppError(
      `Invalid status transition: cannot move from "${order.status}" to "${status}"`,
      400
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              price: true,
            },
          },
        },
      },
    },
  });

  // Add tracking entry
  await orderTrackingService.addTrackingUpdate({
    orderId,
    status,
    description: `Order status updated to ${status}`,
  });

  return updatedOrder;
};

/**
 * Cancel order
 * Restores stock when order is cancelled
 * Enforces state machine transitions
 */
export const cancelOrder = async (orderId: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized to cancel this order', 403);
    }

    // Check if already cancelled
    if (order.status === 'cancelled') {
      throw new AppError('Order is already cancelled', 400);
    }

    // Enforce state machine transition rules
    const currentStatus = order.status as OrderStatus;
    if (!isValidOrderTransition(currentStatus, 'cancelled')) {
      throw new AppError(
        `Cannot cancel order: invalid transition from "${order.status}" to "cancelled"`,
        400
      );
    }

    // Update order status to cancelled
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' as OrderStatus },
    });

    // Restore stock (increment back what was decremented during createOrder)
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Add tracking entry
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'cancelled' as OrderStatus,
        description: 'Order cancelled by user',
      },
    });

    return updatedOrder;
  });
};

/**
 * Refund order (Admin only)
 * Restores stock when order is refunded
 * Enforces state machine transitions
 */
export const refundOrder = async (orderId: string, refundAmount?: number) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Enforce state machine transition rules
    const currentStatus = order.status as OrderStatus;
    if (!isValidOrderTransition(currentStatus, 'refunded')) {
      throw new AppError(
        `Cannot refund order: invalid transition from "${order.status}" to "refunded"`,
        400
      );
    }

    const finalRefundAmount = refundAmount || order.total;

    if (finalRefundAmount > order.total) {
      throw new AppError('Refund amount cannot exceed order total', 400);
    }

    // Update order status to refunded
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'refunded' as OrderStatus },
    });

    // Restore stock (increment back what was decremented during createOrder)
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update payment intent
    await tx.paymentIntent.updateMany({
      where: { orderId },
      data: { status: 'refunded' },
    });

    // Add tracking entry
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'refunded' as OrderStatus,
        description: `Order refunded (amount: ₹${finalRefundAmount})`,
      },
    });

    return {
      order: updatedOrder,
      refundAmount: finalRefundAmount,
    };
  });
};

/**
 * Get order invoice
 */
export const getOrderInvoice = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              price: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.userId !== userId) {
    throw new AppError('Unauthorized to view this invoice', 403);
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const couponDiscount =
    order.coupon && typeof order.coupon === 'object' && 'discount' in order.coupon
      ? (order.coupon as any).discount
      : 0;

  const tax = calculateTax(subtotal, couponDiscount);
  const shippingFee = calculateShipping(subtotal);
  const total = order.total;

  const invoice = {
    invoiceNumber: `INV-${order.id.slice(-8).toUpperCase()}`,
    orderNumber: order.id,
    invoiceDate: order.createdAt,
    dueDate: order.createdAt,
    status: order.status,

    customer: {
      id: order.user.id,
      name: order.user.fullName,
      email: order.user.email,
      phone: order.user.phone || 'N/A',
    },

    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.image,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    })),

    summary: {
      subtotal,
      discount: couponDiscount,
      tax,
      shipping: shippingFee,
      total,
    },

    ...(order.coupon && {
      coupon: order.coupon,
    }),

    company: {
      name: 'AgroMart',
      address: 'Agricultural Market Complex, India',
      email: 'support@agromart.com',
      phone: '+91-1234567890',
      website: 'https://agromart.com',
    },
  };

  return invoice;
};