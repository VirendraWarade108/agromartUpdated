import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as orderTrackingService from '../services/orderTrackingService';

// ============================================
// USER TRACKING ENDPOINTS
// ============================================

/**
 * Get order tracking
 * GET /api/orders/:orderId/tracking
 */
export const getOrderTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { orderId } = req.params;

    const tracking = await orderTrackingService.getOrderTracking(orderId, userId);

    res.json({
      success: true,
      data: tracking,
    });
  }
);

/**
 * Get order tracking timeline
 * GET /api/orders/:orderId/timeline
 */
export const getTrackingTimeline = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { orderId } = req.params;

    const timeline = await orderTrackingService.getTrackingTimeline(orderId, userId);

    res.json({
      success: true,
      data: timeline,
    });
  }
);

/**
 * Get latest tracking status
 * GET /api/orders/:orderId/tracking/latest
 */
export const getLatestTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const latest = await orderTrackingService.getLatestTracking(orderId);

    res.json({
      success: true,
      data: latest,
    });
  }
);

// ============================================
// ADMIN TRACKING ENDPOINTS
// ============================================

/**
 * Add tracking update
 * POST /api/admin/tracking
 */
export const addTrackingUpdate = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);

/**
 * Get orders by status
 * GET /api/admin/tracking/status/:status
 */
export const getOrdersByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = req.params;

    const orders = await orderTrackingService.getOrdersByStatus(status);

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  }
);

/**
 * Bulk update order status
 * POST /api/admin/tracking/bulk-update
 */
export const bulkUpdateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);