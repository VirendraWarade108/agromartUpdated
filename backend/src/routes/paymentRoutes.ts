import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as paymentController from '../controllers/paymentController';
import { verifyWebhookSignature, generateIdempotencyKey } from '../utils/signature';
import { checkIdempotency, setIdempotency } from '../config/redis';
import { env } from '../config/env';
import {
  paymentLimiter,
  paymentVerifyLimiter,
} from '../middleware/rateLimiter';

const router = Router();

/**
 * Create payment intent
 * POST /api/payment/create-intent
 * 
 * Rate Limited: 10 payments per hour per user
 * Protected route - requires authentication
 */
router.post(
  '/create-intent',
  authenticate,
  paymentLimiter,
  asyncHandler(paymentController.createPaymentIntent)
);

/**
 * Verify payment
 * POST /api/payment/verify
 * 
 * Rate Limited: 20 verifications per hour per user
 * Protected route - requires authentication
 */
router.post(
  '/verify',
  authenticate,
  paymentVerifyLimiter,
  asyncHandler(paymentController.verifyPayment)
);

/**
 * Get payment status
 * GET /api/payment/status/:orderId
 * 
 * Rate Limited: No (read-only operation)
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
 * Rate Limited: No (admin only, already protected)
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
 * Rate Limited: No (external service callback)
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
   * Rate Limited: No (development only)
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
   * Rate Limited: No (development only)
   * Test endpoint to simulate failed payment
   */
  router.post(
    '/simulate-failure',
    authenticate,
    asyncHandler(paymentController.simulatePaymentFailure)
  );
}

/**
 * ============================================
 * ROUTE SUMMARY WITH PROTECTION
 * ============================================
 * AUTHENTICATED (Rate Limited):
 *   POST   /payment/create-intent   - 10 req/hour [AUTH REQUIRED]
 *   POST   /payment/verify           - 20 req/hour [AUTH REQUIRED]
 * 
 * AUTHENTICATED (No Rate Limits):
 *   GET    /payment/status/:orderId  - Read-only [AUTH REQUIRED]
 * 
 * ADMIN (No Rate Limits):
 *   POST   /payment/refund           - Admin only [AUTH + ADMIN]
 * 
 * PUBLIC (No Rate Limits):
 *   POST   /payment/webhook          - Signature verified
 * 
 * DEVELOPMENT ONLY:
 *   POST   /payment/simulate-success - Testing only
 *   POST   /payment/simulate-failure - Testing only
 * ============================================
 */

export default router;