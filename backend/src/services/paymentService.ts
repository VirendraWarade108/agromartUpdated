import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import * as orderTrackingService from './orderTrackingService';
import * as productService from './productService';

/**
 * Create payment intent
 */
export const createPaymentIntent = async (amount: number, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (Math.abs(order.total - amount) > 0.01) {
    throw new AppError('Payment amount does not match order total', 400);
  }

  const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const clientSecret = `${paymentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

  const intent = await prisma.paymentIntent.create({
    data: {
      paymentId,
      orderId,
      amount,
      status: 'pending',
      clientSecret,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'processing' },
  });

  return {
    paymentId: intent.paymentId,
    clientSecret: intent.clientSecret,
    status: intent.status,
    amount: intent.amount,
  };
};

/**
 * Verify payment
 */
export const verifyPayment = async (paymentId: string, orderId: string) => {
  const intent = await prisma.paymentIntent.findUnique({
    where: { paymentId },
  });

  if (!intent) {
    throw new AppError('Payment intent not found', 404);
  }

  if (intent.orderId !== orderId) {
    throw new AppError('Payment does not match order', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    await prisma.paymentIntent.update({
      where: { paymentId },
      data: { status: 'succeeded' },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' },
    });

    return {
      success: true,
      paymentId,
      status: 'succeeded',
      message: 'Payment verified successfully',
    };
  } else {
    await prisma.paymentIntent.update({
      where: { paymentId },
      data: { status: 'failed' },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'failed' },
    });

    throw new AppError('Payment verification failed', 400);
  }
};

/**
 * Get payment status
 */
export const getPaymentStatus = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const paymentIntent = await prisma.paymentIntent.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

  if (!paymentIntent) {
    return {
      orderId,
      orderStatus: order.status,
      paymentStatus: 'no_payment',
      message: 'No payment initiated for this order',
    };
  }

  return {
    orderId,
    orderStatus: order.status,
    paymentId: paymentIntent.paymentId,
    paymentStatus: paymentIntent.status,
    amount: paymentIntent.amount,
    createdAt: paymentIntent.createdAt,
  };
};

/**
 * Process refund (Admin only)
 */
export const processRefund = async (orderId: string, amount?: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status !== 'paid' && order.status !== 'delivered') {
    throw new AppError('Order cannot be refunded in current status', 400);
  }

  const refundAmount = amount || order.total;

  if (refundAmount > order.total) {
    throw new AppError('Refund amount cannot exceed order total', 400);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'refunded' },
  });

  await prisma.paymentIntent.updateMany({
    where: { orderId },
    data: { status: 'refunded' },
  });

  // Restore stock
  await productService.restoreStock(
    order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  );

  // Add tracking
  await orderTrackingService.addTrackingUpdate({
    orderId,
    status: 'refunded',
    description: `Refund processed (₹${refundAmount})`,
  });

  const refundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    refundId,
    orderId,
    amount: refundAmount,
    status: 'succeeded',
    message: 'Refund processed successfully',
  };
};

/**
 * Handle payment webhook event
 */
export const handlePaymentWebhook = async (event: {
  type: string;
  data: {
    paymentId: string;
    orderId: string;
    amount: number;
    status: string;
  };
}) => {
  const { type, data } = event;

  if (type === 'payment_intent.succeeded') {
    return await handlePaymentSuccess(data.paymentId, data.orderId);
  } else if (type === 'payment_intent.failed') {
    return await handlePaymentFailure(data.paymentId, data.orderId);
  }

  throw new AppError('Unsupported webhook event type', 400);
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentId: string, orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Update payment intent
    const intent = await tx.paymentIntent.findUnique({
      where: { paymentId },
    });

    if (!intent) {
      throw new AppError('Payment intent not found', 404);
    }

    if (intent.status === 'succeeded') {
      // Already processed
      return { success: true, message: 'Payment already processed' };
    }

    await tx.paymentIntent.update({
      where: { paymentId },
      data: { status: 'succeeded' },
    });

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'paid' },
    });

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'paid',
        description: 'Payment successful',
      },
    });

    return { success: true, message: 'Payment processed successfully' };
  });
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentId: string, orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    // Update payment intent
    const intent = await tx.paymentIntent.findUnique({
      where: { paymentId },
    });

    if (!intent) {
      throw new AppError('Payment intent not found', 404);
    }

    await tx.paymentIntent.update({
      where: { paymentId },
      data: { status: 'failed' },
    });

    // Get order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'failed' },
    });

    // Restore stock
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

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'failed',
        description: 'Payment failed - stock restored',
      },
    });

    return { success: true, message: 'Payment failure handled' };
  });
};