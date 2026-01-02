import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Validate and apply coupon
 */
export const validateCoupon = async (code: string, orderTotal: number) => {
  // Find coupon by code
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
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

  // Calculate discount
  let discountAmount = 0;

  if (coupon.type === 'percentage') {
    discountAmount = (orderTotal * coupon.value) / 100;
    
    // Apply max discount limit if set
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.type === 'fixed') {
    discountAmount = coupon.value;
    
    // Discount cannot exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }
  }

  return {
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount: Math.round(discountAmount),
  };
};

/**
 * Apply coupon (increment usage count)
 */
export const applyCoupon = async (couponId: string) => {
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
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
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
  // Check if code already exists
  const existing = await prisma.coupon.findUnique({
    where: { code: data.code.toUpperCase() },
  });

  if (existing) {
    throw new AppError('Coupon code already exists', 400);
  }

  // Validate value
  if (data.type === 'percentage' && (data.value < 0 || data.value > 100)) {
    throw new AppError('Percentage must be between 0 and 100', 400);
  }

  if (data.type === 'fixed' && data.value < 0) {
    throw new AppError('Value must be positive', 400);
  }

  // Create coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue,
      maxDiscount: data.maxDiscount,
      usageLimit: data.usageLimit,
      validFrom: data.validFrom,
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
  // Check if coupon exists
  await getCouponById(id);

  // If updating code, check for duplicates
  if (data.code) {
    const existing = await prisma.coupon.findFirst({
      where: {
        code: data.code.toUpperCase(),
        id: { not: id },
      },
    });

    if (existing) {
      throw new AppError('Coupon code already exists', 400);
    }
  }

  // Validate value if provided
  if (data.type === 'percentage' && data.value !== undefined) {
    if (data.value < 0 || data.value > 100) {
      throw new AppError('Percentage must be between 0 and 100', 400);
    }
  }

  if (data.type === 'fixed' && data.value !== undefined && data.value < 0) {
    throw new AppError('Value must be positive', 400);
  }

  // Update coupon
  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code && { code: data.code.toUpperCase() }),
      ...data,
    },
  });

  return coupon;
};

/**
 * Delete coupon (Admin)
 */
export const deleteCoupon = async (id: string) => {
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
  const coupon = await getCouponById(id);

  const totalRevenue = coupon.usedCount * (coupon.type === 'fixed' ? coupon.value : 0);

  return {
    coupon,
    stats: {
      usedCount: coupon.usedCount,
      remainingUses: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : null,
      totalRevenue,
    },
  };
};