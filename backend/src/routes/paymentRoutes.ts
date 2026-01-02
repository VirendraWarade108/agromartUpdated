import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as paymentController from '../controllers/paymentController';
import { verifyWebhookSignature, generateIdempotencyKey } from '../utils/signature';
import { checkIdempotency, setIdempotency } from '../config/redis';
import { env } from '../config/env';

const router = Router();

/**
 * Create payment intent
 * POST /api/payment/create-intent
 * 
 * Protected route - requires authentication
 */
router.post(
  '/create-intent',
  authenticate,
  asyncHandler(paymentController.createPaymentIntent)
);

/**
 * Verify payment
 * POST /api/payment/verify
 * 
 * Protected route - requires authentication
 */
router.post(
  '/verify',
  authenticate,
  asyncHandler(paymentController.verifyPayment)
);

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 * 
 * Protected route - requires authentication
 */
router.get(
  '/status/:orderId',
  authenticate,
  asyncHandler(paymentController.getPaymentStatus)
);

/**
 * Process refund (Admin only)
 * POST /api/payment/refund
 * 
 * Protected route - requires admin access
 */
router.post(
  '/refund',
  authenticate,
  requireAdmin,
  asyncHandler(paymentController.processRefund)
);

/**
 * Payment webhook
 * POST /api/payment/webhook
 * 
 * Public endpoint - uses signature verification
 * Handles incoming webhook events from payment provider
 */
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Missing signature header',
        },
      });
    }

    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      env.PAYMENT_STRIPE_WEBHOOK_SECRET
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature',
        },
      });
    }

    // Extract event data
    const event = req.body;
    const eventId = event.id || `evt_${Date.now()}`;

    // Check idempotency to prevent duplicate processing
    const idempotencyKey = generateIdempotencyKey(eventId);
    const alreadyProcessed = await checkIdempotency(idempotencyKey);

    if (alreadyProcessed) {
      return res.status(200).json({
        success: true,
        data: {
          received: true,
          eventId,
          message: 'Event already processed',
        },
      });
    }

    // Process webhook using controller
    try {
      await paymentController.handleWebhook(req, res);

      // Mark as processed in Redis (24 hours expiry)
      await setIdempotency(idempotencyKey, 'processed');
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      
      // Don't mark as processed if it failed
      // This allows retry on next webhook attempt
      throw error;
    }
  })
);

/**
 * Test endpoints (Development only)
 * These should be removed or disabled in production
 */
if (env.isDevelopment) {
  /**
   * Simulate payment success
   * POST /api/payment/simulate-success
   * 
   * Test endpoint to simulate successful payment
   */
  router.post(
    '/simulate-success',
    authenticate,
    asyncHandler(paymentController.simulatePaymentSuccess)
  );

  /**
   * Simulate payment failure
   * POST /api/payment/simulate-failure
   * 
   * Test endpoint to simulate failed payment
   */
  router.post(
    '/simulate-failure',
    authenticate,
    asyncHandler(paymentController.simulatePaymentFailure)
  );
}

export default router;