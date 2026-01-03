import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Validate and apply coupon
 * This is the authoritative source for coupon validation
 * All validation rules are enforced here
 */
export const validateCoupon = async (code: string, orderTotal: number) => {
  // Validate input parameters
  if (!code || typeof code !== 'string' || code.trim() === '') {
    throw new AppError('Coupon code is required', 400);
  }

  if (typeof orderTotal !== 'number' || orderTotal < 0) {
    throw new AppError('Invalid order total', 400);
  }

  // Normalize coupon code
  const normalizedCode = code.trim().toUpperCase();

  // Find coupon by code
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new AppError('Invalid coupon code', 400);
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    throw new AppError('This coupon is no longer active', 400);
  }

  // Check validity dates
  const now = new Date();
  if (now < coupon.validFrom) {
    throw new AppError('This coupon is not yet valid', 400);
  }

  if (now > coupon.validUntil) {
    throw new AppError('This coupon has expired', 400);
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit', 400);
  }

  // Check minimum order value
  if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
    throw new AppError(
      `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      400
    );
  }

  // Calculate discount amount based on coupon type
  let discountAmount = 0;

  if (coupon.type === 'percentage') {
    // Validate percentage value
    if (coupon.value < 0 || coupon.value > 100) {
      throw new AppError('Invalid coupon configuration', 500);
    }

    // Calculate percentage discount
    discountAmount = (orderTotal * coupon.value) / 100;
    
    // Apply max discount limit if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'fixed') {
    // Validate fixed value
    if (coupon.value < 0) {
      throw new AppError('Invalid coupon configuration', 500);
    }

    discountAmount = coupon.value;
    
    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }
  } else {
    throw new AppError('Invalid coupon type', 500);
  }

  // Ensure discount is non-negative
  if (discountAmount < 0) {
    discountAmount = 0;
  }

  // Round discount to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount,
  };
};

/**
 * Apply coupon (increment usage count)
 * Only called after successful order creation
 */
export const applyCoupon = async (couponId: string) => {
  if (!couponId || typeof couponId !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  // Increment usage count
  await prisma.coupon.update({
    where: { id: couponId },
    data: {
      usedCount: { increment: 1 },
    },
  });
};

/**
 * Get all coupons (Admin)
 */
export const getAllCoupons = async (filters?: {
  isActive?: boolean;
  search?: string;
}) => {
  const where: any = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const coupons = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return coupons;
};

/**
 * Get coupon by ID (Admin)
 */
export const getCouponById = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  return coupon;
};

/**
 * Get coupon by code (Public - for preview)
 */
export const getCouponByCode = async (code: string) => {
  if (!code || typeof code !== 'string' || code.trim() === '') {
    throw new AppError('Coupon code is required', 400);
  }

  const normalizedCode = code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
    select: {
      code: true,
      description: true,
      type: true,
      value: true,
      minOrderValue: true,
      maxDiscount: true,
      validUntil: true,
      isActive: true,
    },
  });

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  return coupon;
};

/**
 * Create coupon (Admin)
 */
export const createCoupon = async (data: {
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom?: Date;
  validUntil: Date;
  isActive?: boolean;
}) => {
  // Validate required fields
  if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
    throw new AppError('Coupon code is required', 400);
  }

  if (!data.type || !['percentage', 'fixed'].includes(data.type)) {
    throw new AppError('Type must be either "percentage" or "fixed"', 400);
  }

  if (typeof data.value !== 'number') {
    throw new AppError('Value is required and must be a number', 400);
  }

  if (!data.validUntil || !(data.validUntil instanceof Date)) {
    throw new AppError('Valid until date is required', 400);
  }

  // Normalize code
  const normalizedCode = data.code.trim().toUpperCase();

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (existing) {
    throw new AppError('Coupon code already exists', 400);
  }

  // Validate value based on type
  if (data.type === 'percentage') {
    if (data.value < 0 || data.value > 100) {
      throw new AppError('Percentage must be between 0 and 100', 400);
    }
  } else if (data.type === 'fixed') {
    if (data.value < 0) {
      throw new AppError('Value must be positive', 400);
    }
  }

  // Validate optional numeric fields
  if (data.minOrderValue !== undefined && (typeof data.minOrderValue !== 'number' || data.minOrderValue < 0)) {
    throw new AppError('Minimum order value must be a positive number', 400);
  }

  if (data.maxDiscount !== undefined && (typeof data.maxDiscount !== 'number' || data.maxDiscount < 0)) {
    throw new AppError('Maximum discount must be a positive number', 400);
  }

  if (data.usageLimit !== undefined && (typeof data.usageLimit !== 'number' || data.usageLimit < 1)) {
    throw new AppError('Usage limit must be at least 1', 400);
  }

  // Validate date logic
  if (data.validFrom && data.validFrom >= data.validUntil) {
    throw new AppError('Valid from date must be before valid until date', 400);
  }

  // Create coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: normalizedCode,
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  return coupon;
};

/**
 * Update coupon (Admin)
 */
export const updateCoupon = async (
  id: string,
  data: {
    code?: string;
    description?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    minOrderValue?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom?: Date;
    validUntil?: Date;
    isActive?: boolean;
  }
) => {
  // Validate ID
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  // Check if coupon exists
  const existingCoupon = await getCouponById(id);

  // If updating code, check for duplicates
  if (data.code) {
    if (typeof data.code !== 'string' || data.code.trim() === '') {
      throw new AppError('Coupon code cannot be empty', 400);
    }

    const normalizedCode = data.code.trim().toUpperCase();

    const duplicate = await prisma.coupon.findFirst({
      where: {
        code: normalizedCode,
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError('Coupon code already exists', 400);
    }

    data.code = normalizedCode;
  }

  // Validate type if provided
  if (data.type && !['percentage', 'fixed'].includes(data.type)) {
    throw new AppError('Type must be either "percentage" or "fixed"', 400);
  }

  // Validate value based on type
  const finalType = data.type || existingCoupon.type;
  if (data.value !== undefined) {
    if (typeof data.value !== 'number') {
      throw new AppError('Value must be a number', 400);
    }

    if (finalType === 'percentage') {
      if (data.value < 0 || data.value > 100) {
        throw new AppError('Percentage must be between 0 and 100', 400);
      }
    } else if (finalType === 'fixed') {
      if (data.value < 0) {
        throw new AppError('Value must be positive', 400);
      }
    }
  }

  // Validate optional numeric fields
  if (data.minOrderValue !== undefined && (typeof data.minOrderValue !== 'number' || data.minOrderValue < 0)) {
    throw new AppError('Minimum order value must be a positive number', 400);
  }

  if (data.maxDiscount !== undefined && (typeof data.maxDiscount !== 'number' || data.maxDiscount < 0)) {
    throw new AppError('Maximum discount must be a positive number', 400);
  }

  if (data.usageLimit !== undefined && (typeof data.usageLimit !== 'number' || data.usageLimit < 1)) {
    throw new AppError('Usage limit must be at least 1', 400);
  }

  // Validate date logic if both dates are being set
  if (data.validFrom && data.validUntil) {
    if (data.validFrom >= data.validUntil) {
      throw new AppError('Valid from date must be before valid until date', 400);
    }
  } else if (data.validFrom) {
    const finalValidUntil = data.validUntil || existingCoupon.validUntil;
    if (data.validFrom >= finalValidUntil) {
      throw new AppError('Valid from date must be before valid until date', 400);
    }
  } else if (data.validUntil) {
    const finalValidFrom = data.validFrom || existingCoupon.validFrom;
    if (finalValidFrom >= data.validUntil) {
      throw new AppError('Valid from date must be before valid until date', 400);
    }
  }

  // Update coupon
  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  });

  return coupon;
};

/**
 * Delete coupon (Admin)
 */
export const deleteCoupon = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  // Check if coupon exists
  await getCouponById(id);

  await prisma.coupon.delete({
    where: { id },
  });
};

/**
 * Toggle coupon active status (Admin)
 */
export const toggleCouponStatus = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await getCouponById(id);

  const updated = await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });

  return updated;
};

/**
 * Get coupon statistics (Admin)
 */
export const getCouponStats = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new AppError('Invalid coupon ID', 400);
  }

  const coupon = await getCouponById(id);

  // Note: Revenue calculation is approximate and doesn't account for 
  // actual order totals or whether orders were completed
  const estimatedRevenue = coupon.usedCount * (coupon.type === 'fixed' ? coupon.value : 0);

  return {
    coupon,
    stats: {
      usedCount: coupon.usedCount,
      remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : null,
      estimatedRevenue,
    },
  };
};