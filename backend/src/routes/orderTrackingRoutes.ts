import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as orderTrackingService from '../services/orderTrackingService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { Request, Response } from 'express';

const router = Router();

// ============================================
// USER TRACKING ENDPOINTS
// ============================================

/**
 * Get order tracking
 * GET /api/orders/:orderId/tracking
 */
router.get(
  '/:orderId/tracking',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { orderId } = req.params;

    const tracking = await orderTrackingService.getOrderTracking(
      orderId,
      userId
    );

    res.json({
      success: true,
      data: tracking,
    });
  })
);

/**
 * Get order tracking timeline
 * GET /api/orders/:orderId/timeline
 */
router.get(
  '/:orderId/timeline',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { orderId } = req.params;

    const timeline = await orderTrackingService.getTrackingTimeline(
      orderId,
      userId
    );

    res.json({
      success: true,
      data: timeline,
    });
  })
);

/**
 * Get latest tracking status
 * GET /api/orders/:orderId/tracking/latest
 */
router.get(
  '/:orderId/tracking/latest',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const latest = await orderTrackingService.getLatestTracking(orderId);

    res.json({
      success: true,
      data: latest,
    });
  })
);

// ============================================
// ADMIN TRACKING ENDPOINTS
// ============================================

/**
 * Add tracking update
 * POST /api/admin/tracking
 */
router.post(
  '/admin/tracking',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, status, location, description, metadata } = req.body;

    // Validate required fields
    if (!orderId || !status || !description) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, status, and description are required',
      });
    }

    const tracking = await orderTrackingService.addTrackingUpdate({
      orderId,
      status,
      location,
      description,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Tracking update added successfully',
      data: tracking,
    });
  })
);

/**
 * Get orders by status
 * GET /api/admin/tracking/status/:status
 */
router.get(
  '/admin/tracking/status/:status',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;

    const orders = await orderTrackingService.getOrdersByStatus(status);

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  })
);

/**
 * Bulk update order status
 * POST /api/admin/tracking/bulk-update
 */
router.post(
  '/admin/tracking/bulk-update',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    const result = await orderTrackingService.bulkUpdateOrderStatus(updates);

    res.json({
      success: true,
      message: `Bulk update completed. ${result.succeeded} succeeded, ${result.failed} failed.`,
      data: result,
    });
  })
);

export default router;