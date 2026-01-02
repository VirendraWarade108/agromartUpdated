import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as paymentService from '../services/paymentService';
import { verifyWebhookSignature, generateIdempotencyKey } from '../utils/signature';
import { checkIdempotency, setIdempotency } from '../config/redis';
import { env } from '../config/env';

const router = Router();

/**
 * Create payment intent
 * POST /api/payment/create-intent
 */
router.post(
  '/create-intent',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and orderId are required',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const result = await paymentService.createPaymentIntent(amount, orderId);

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      data: result,
    });
  })
);

/**
 * Verify payment
 * POST /api/payment/verify
 */
router.post(
  '/verify',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { paymentId, orderId } = req.body;

    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'PaymentId and orderId are required',
      });
    }

    const result = await paymentService.verifyPayment(paymentId, orderId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 */
router.get(
  '/status/:orderId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result = await paymentService.getPaymentStatus(orderId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * Process refund (Admin only)
 * POST /api/payment/refund
 */
router.post(
  '/refund',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'OrderId is required',
      });
    }

    const result = await paymentService.processRefund(orderId, amount);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result,
    });
  })
);

/**
 * Payment webhook
 * POST /api/payment/webhook
 */
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing signature header',
      });
    }

    const rawBody = JSON.stringify(req.body);

    // Verify signature
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      env.PAYMENT_STRIPE_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    // Extract event
    const event = req.body;
    const eventId = event.id || `evt_${Date.now()}`;

    // Check idempotency
    const idempotencyKey = generateIdempotencyKey(eventId);
    const alreadyProcessed = await checkIdempotency(idempotencyKey);

    if (alreadyProcessed) {
      return res.json({
        success: true,
        message: 'Event already processed',
      });
    }

    // Process webhook
    try {
      await paymentService.handlePaymentWebhook(event);

      // Mark as processed
      await setIdempotency(idempotencyKey, 'processed');

      res.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Webhook processing failed',
      });
    }
  })
);

export default router;