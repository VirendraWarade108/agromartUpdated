import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import { AppError } from '../middleware/errorHandler';

/**
 * Create payment intent
 * POST /api/payment/create-intent
 * 
 * Request body:
 * {
 *   amount: number,
 *   orderId: string
 * }
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount and orderId are required',
        },
      });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be a positive number',
        },
      });
      return;
    }

    const result = await paymentService.createPaymentIntent(amount, orderId);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create payment intent',
      },
    });
  }
};

/**
 * Verify payment
 * POST /api/payment/verify
 * 
 * Request body:
 * {
 *   paymentId: string,
 *   orderId: string
 * }
 */
export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'PaymentId and orderId are required',
        },
      });
      return;
    }

    const result = await paymentService.verifyPayment(paymentId, orderId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to verify payment',
      },
    });
  }
};

/**
 * Get payment status for an order
 * GET /api/payment/status/:orderId
 */
export const getPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'OrderId is required',
        },
      });
      return;
    }

    const result = await paymentService.getPaymentStatus(orderId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to get payment status',
      },
    });
  }
};

/**
 * Process refund (Admin only)
 * POST /api/payment/refund
 * 
 * Request body:
 * {
 *   orderId: string,
 *   amount?: number (optional, defaults to full refund)
 * }
 */
export const processRefund = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'OrderId is required',
        },
      });
      return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be a positive number if provided',
        },
      });
      return;
    }

    const result = await paymentService.processRefund(orderId, amount);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to process refund',
      },
    });
  }
};

/**
 * Handle payment webhook
 * POST /api/payment/webhook
 * 
 * Webhook from payment provider (e.g., Stripe)
 * No authentication required - uses signature verification
 */
export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Missing signature header',
        },
      });
      return;
    }

    // Event should be in request body
    const event = req.body;

    if (!event || !event.id || !event.type) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook event format',
        },
      });
      return;
    }

    // Validate event data object
    if (!event.data || !event.data.object) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook event data structure',
        },
      });
      return;
    }

    // Validate required fields in event data
    const eventData = event.data.object;
    if (!eventData.id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing payment ID in webhook event',
        },
      });
      return;
    }

    // Process webhook (signature verification happens in route middleware)
    await paymentService.handlePaymentWebhook(event);

    // Always return 200 for successfully received webhooks
    // Even if processing had issues, we don't want the provider to retry
    res.status(200).json({
      success: true,
      data: {
        received: true,
        eventId: event.id,
      },
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // For webhook endpoints, we typically return 200 even on errors
    // to prevent the payment provider from retrying
    // Log the error but acknowledge receipt
    if (error instanceof AppError) {
      // Log but still return 200 to prevent retries
      console.error(`Webhook AppError (${error.statusCode}):`, error.message);
      
      res.status(200).json({
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: 'Webhook received but processing encountered an issue',
        },
      });
      return;
    }

    // For unexpected errors, also return 200 to prevent infinite retries
    console.error('Webhook unexpected error:', error.message || error);
    
    res.status(200).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Webhook received but processing encountered an issue',
      },
    });
  }
};

/**
 * Simulate payment success (Test endpoint - should be removed in production)
 * POST /api/payment/simulate-success
 * 
 * Request body:
 * {
 *   paymentId: string
 * }
 */
export const simulatePaymentSuccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'PaymentId is required',
        },
      });
      return;
    }

    await paymentService.simulatePaymentSuccess(paymentId);

    res.status(200).json({
      success: true,
      data: {
        message: 'Payment success simulated',
        paymentId,
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to simulate payment',
      },
    });
  }
};

/**
 * Simulate payment failure (Test endpoint - should be removed in production)
 * POST /api/payment/simulate-failure
 * 
 * Request body:
 * {
 *   paymentId: string
 * }
 */
export const simulatePaymentFailure = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'PaymentId is required',
        },
      });
      return;
    }

    await paymentService.simulatePaymentFailure(paymentId);

    res.status(200).json({
      success: true,
      data: {
        message: 'Payment failure simulated',
        paymentId,
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.statusCode === 404 ? 'NOT_FOUND' : 'PAYMENT_FAILED',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to simulate payment failure',
      },
    });
  }
};