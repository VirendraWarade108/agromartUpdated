import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { checkIdempotency, setIdempotency } from '../config/redis';
import { verifyWebhookSignature } from '../utils/signature';
import * as orderTrackingService from './orderTrackingService';

/**
 * Payment status types
 */
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

/**
 * Webhook event types
 */
export type WebhookEventType = 
  | 'payment_intent.created'
  | 'payment_intent.processing'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'charge.refunded';

/**
 * Payment intent data structure
 */
interface PaymentIntentData {
  id: string;
  amount: number;
  status: PaymentStatus;
  clientSecret?: string;
  orderId: string;
}

/**
 * Webhook event structure
 */
interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: {
    object: {
      id: string;
      amount: number;
      status: string;
      metadata?: {
        orderId?: string;
      };
    };
  };
}

/**
 * Create payment intent
 * Simulates creating a payment intent (Stripe-like)
 */
export const createPaymentIntent = async (
  amount: number,
  orderId: string
): Promise<PaymentIntentData> => {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { paymentIntents: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if payment already exists
    const existingPayment = order.paymentIntents.find(
      (pi) => pi.status === 'succeeded' || pi.status === 'processing'
    );

    if (existingPayment) {
      throw new AppError('Payment already exists for this order', 400);
    }

    // Generate payment ID (simulating external payment provider)
    const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate client secret
    const clientSecret = `${paymentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

    // Create payment intent in database
    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        paymentId,
        orderId,
        amount,
        status: 'pending',
        clientSecret,
        metadata: {
          createdAt: new Date().toISOString(),
          currency: 'INR',
        },
      },
    });

    // Add tracking entry
    await orderTrackingService.addTrackingUpdate({
      orderId,
      status: 'payment_pending',
      description: 'Payment intent created',
    });

    return {
      id: paymentIntent.paymentId,
      amount: paymentIntent.amount,
      status: paymentIntent.status as PaymentStatus,
      clientSecret: paymentIntent.clientSecret || undefined,
      orderId: paymentIntent.orderId,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error.message || 'Failed to create payment intent',
      500
    );
  }
};

/**
 * Verify payment status
 * Check if payment was successful
 */
export const verifyPayment = async (
  paymentId: string,
  orderId: string
): Promise<{
  success: boolean;
  status: PaymentStatus;
  order?: any;
}> => {
  try {
    // Find payment intent
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { paymentId },
      include: {
        order: {
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
        },
      },
    });

    if (!paymentIntent) {
      throw new AppError('Payment not found', 404);
    }

    if (paymentIntent.orderId !== orderId) {
      throw new AppError('Payment does not match order', 400);
    }

    const isSuccessful = paymentIntent.status === 'succeeded';

    return {
      success: isSuccessful,
      status: paymentIntent.status as PaymentStatus,
      order: isSuccessful ? paymentIntent.order : undefined,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error.message || 'Failed to verify payment',
      500
    );
  }
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (
  orderId: string
): Promise<{
  orderId: string;
  payments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    createdAt: Date;
  }>;
  latestStatus: PaymentStatus | null;
}> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentIntents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const payments = order.paymentIntents.map((pi) => ({
      id: pi.paymentId,
      amount: pi.amount,
      status: pi.status as PaymentStatus,
      createdAt: pi.createdAt,
    }));

    const latestStatus = payments.length > 0 
      ? (payments[0].status as PaymentStatus)
      : null;

    return {
      orderId,
      payments,
      latestStatus,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error.message || 'Failed to get payment status',
      500
    );
  }
};

/**
 * Process refund for an order
 */
export const processRefund = async (
  orderId: string,
  amount?: number
): Promise<{
  success: boolean;
  refundAmount: number;
  paymentId: string;
}> => {
  return await prisma.$transaction(async (tx) => {
    try {
      // Find order with payment
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          paymentIntents: {
            where: { status: 'succeeded' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.paymentIntents.length === 0) {
        throw new AppError('No successful payment found for this order', 400);
      }

      const payment = order.paymentIntents[0];
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new AppError('Refund amount cannot exceed payment amount', 400);
      }

      if (refundAmount <= 0) {
        throw new AppError('Refund amount must be greater than 0', 400);
      }

      // Update payment status to refunded
      await tx.paymentIntent.update({
        where: { id: payment.id },
        data: {
          status: 'refunded',
          metadata: {
            ...(typeof payment.metadata === 'object' && payment.metadata !== null 
              ? payment.metadata 
              : {}),
            refundedAt: new Date().toISOString(),
            refundAmount,
          },
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'refunded' },
      });

      // Add tracking entry
      await tx.orderTracking.create({
        data: {
          orderId,
          status: 'refunded',
          description: `Payment refunded: ₹${refundAmount}`,
        },
      });

      return {
        success: true,
        refundAmount,
        paymentId: payment.paymentId,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        error.message || 'Failed to process refund',
        500
      );
    }
  });
};

/**
 * Handle payment webhook events
 * Processes incoming webhook events from payment provider
 */
export const handlePaymentWebhook = async (
  event: WebhookEvent
): Promise<void> => {
  try {
    const { id: eventId, type, data } = event;
    const paymentData = data.object;
    const paymentId = paymentData.id;
    const orderId = paymentData.metadata?.orderId;

    if (!orderId) {
      console.error('Webhook event missing orderId in metadata:', eventId);
      throw new AppError('Missing orderId in webhook metadata', 400);
    }

    // Handle different event types
    switch (type) {
      case 'payment_intent.created':
        await handlePaymentCreated(paymentId, orderId, paymentData);
        break;

      case 'payment_intent.processing':
        await handlePaymentProcessing(paymentId, orderId, paymentData);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(paymentId, orderId, paymentData);
        break;

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await handlePaymentFailed(paymentId, orderId, paymentData);
        break;

      case 'charge.refunded':
        await handlePaymentRefunded(paymentId, orderId, paymentData);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error: any) {
    console.error('Webhook handling error:', error);
    throw new AppError(
      error.message || 'Webhook processing failed',
      500
    );
  }
};

/**
 * Handle payment created event
 */
const handlePaymentCreated = async (
  paymentId: string,
  orderId: string,
  paymentData: any
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Check if payment already exists
    const existing = await tx.paymentIntent.findUnique({
      where: { paymentId },
    });

    if (existing) {
      return; // Already processed
    }

    // Create payment intent
    await tx.paymentIntent.create({
      data: {
        paymentId,
        orderId,
        amount: paymentData.amount / 100, // Convert from cents
        status: 'pending',
        metadata: {
          webhookProcessedAt: new Date().toISOString(),
        },
      },
    });

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'payment_created',
        description: 'Payment created',
      },
    });
  });
};

/**
 * Handle payment processing event
 */
const handlePaymentProcessing = async (
  paymentId: string,
  orderId: string,
  paymentData: any
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.paymentIntent.updateMany({
      where: { paymentId },
      data: { status: 'processing' },
    });

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'processing' },
    });

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'processing',
        description: 'Payment is being processed',
      },
    });
  });
};

/**
 * Handle payment succeeded event
 */
const handlePaymentSucceeded = async (
  paymentId: string,
  orderId: string,
  paymentData: any
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.paymentIntent.updateMany({
      where: { paymentId },
      data: {
        status: 'succeeded',
        metadata: {
          succeededAt: new Date().toISOString(),
        },
      },
    });

    // Update order status to paid
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'paid' },
    });

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'paid',
        description: 'Payment completed successfully',
      },
    });
  });
};

/**
 * Handle payment failed event
 */
const handlePaymentFailed = async (
  paymentId: string,
  orderId: string,
  paymentData: any
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    // Get order with items
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Update payment status
    await tx.paymentIntent.updateMany({
      where: { paymentId },
      data: {
        status: 'failed',
        metadata: {
          failedAt: new Date().toISOString(),
          reason: paymentData.last_payment_error?.message || 'Payment failed',
        },
      },
    });

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'failed' },
    });

    // Restore stock (since payment failed, order should be cancelled)
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
        description: 'Payment failed - order cancelled and stock restored',
      },
    });
  });
};

/**
 * Handle payment refunded event
 */
const handlePaymentRefunded = async (
  paymentId: string,
  orderId: string,
  paymentData: any
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const refundAmount = paymentData.amount_refunded / 100; // Convert from cents

    // Update payment status
    await tx.paymentIntent.updateMany({
      where: { paymentId },
      data: {
        status: 'refunded',
        metadata: {
          refundedAt: new Date().toISOString(),
          refundAmount,
        },
      },
    });

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'refunded' },
    });

    // Add tracking
    await tx.orderTracking.create({
      data: {
        orderId,
        status: 'refunded',
        description: `Refund processed: ₹${refundAmount}`,
      },
    });
  });
};

/**
 * Simulate payment success (for testing)
 * In production, this would be handled by actual payment provider
 */
export const simulatePaymentSuccess = async (
  paymentId: string
): Promise<void> => {
  const payment = await prisma.paymentIntent.findUnique({
    where: { paymentId },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Simulate webhook event
  const event: WebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentId,
        amount: payment.amount * 100, // Convert to cents
        status: 'succeeded',
        metadata: {
          orderId: payment.orderId,
        },
      },
    },
  };

  await handlePaymentWebhook(event);
};

/**
 * Simulate payment failure (for testing)
 */
export const simulatePaymentFailure = async (
  paymentId: string
): Promise<void> => {
  const payment = await prisma.paymentIntent.findUnique({
    where: { paymentId },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Simulate webhook event
  const event: WebhookEvent = {
    id: `evt_${Date.now()}`,
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        id: paymentId,
        amount: payment.amount * 100,
        status: 'failed',
        metadata: {
          orderId: payment.orderId,
        },
      },
    },
  };

  await handlePaymentWebhook(event);
};