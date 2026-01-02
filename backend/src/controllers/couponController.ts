import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as couponService from '../services/couponService';

// ============================================
// PUBLIC COUPON ENDPOINTS
// ============================================

/**
 * Validate coupon code
 * POST /api/cart/coupon/validate
 */
export const validateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, orderTotal } = req.body;

    if (!code || orderTotal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and order total are required',
      });
    }

    const result = await couponService.validateCoupon(code, orderTotal);

    res.json({
      success: true,
      message: 'Coupon is valid',
      data: result,
    });
  }
);

/**
 * Get coupon details by code (preview)
 * GET /api/coupons/:code
 */
export const getCouponByCode = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = req.params;

    const coupon = await couponService.getCouponByCode(code);

    res.json({
      success: true,
      data: coupon,
    });
  }
);

// ============================================
// ADMIN COUPON ENDPOINTS
// ============================================

/**
 * Get all coupons (Admin)
 * GET /api/admin/coupons
 */
export const getAllCoupons = asyncHandler(
  async (req: Request, res: Response) => {
    const { isActive, search } = req.query;

    const coupons = await couponService.getAllCoupons({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
    });

    res.json({
      success: true,
      data: coupons,
    });
  }
);

/**
 * Get single coupon by ID (Admin)
 * GET /api/admin/coupons/:id
 */
export const getCouponById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const coupon = await couponService.getCouponById(id);

    res.json({
      success: true,
      data: coupon,
    });
  }
);

/**
 * Create coupon (Admin)
 * POST /api/admin/coupons
 */
export const createCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      code,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    // Validation
    if (!code || !type || value === undefined || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, type, value, validUntil',
      });
    }

    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "percentage" or "fixed"',
      });
    }

    const coupon = await couponService.createCoupon({
      code,
      description,
      type,
      value: parseInt(value),
      minOrderValue: minOrderValue ? parseInt(minOrderValue) : undefined,
      maxDiscount: maxDiscount ? parseInt(maxDiscount) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: new Date(validUntil),
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  }
);

/**
 * Update coupon (Admin)
 * PUT /api/admin/coupons/:id
 */
export const updateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      code,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive,
    } = req.body;

    const coupon = await couponService.updateCoupon(id, {
      code,
      description,
      type,
      value: value !== undefined ? parseInt(value) : undefined,
      minOrderValue: minOrderValue !== undefined ? parseInt(minOrderValue) : undefined,
      maxDiscount: maxDiscount !== undefined ? parseInt(maxDiscount) : undefined,
      usageLimit: usageLimit !== undefined ? parseInt(usageLimit) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      isActive,
    });

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  }
);

/**
 * Delete coupon (Admin)
 * DELETE /api/admin/coupons/:id
 */
export const deleteCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    await couponService.deleteCoupon(id);

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  }
);

/**
 * Toggle coupon status (Admin)
 * PUT /api/admin/coupons/:id/toggle
 */
export const toggleCouponStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const coupon = await couponService.toggleCouponStatus(id);

    res.json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: coupon,
    });
  }
);

/**
 * Get coupon statistics (Admin)
 * GET /api/admin/coupons/:id/stats
 */
export const getCouponStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const stats = await couponService.getCouponStats(id);

    res.json({
      success: true,
      data: stats,
    });
  }
);