import { z } from 'zod';

// ============================================
// VALIDATE COUPON VALIDATION
// ============================================
export const validateCouponSchema = {
  body: z.object({
    code: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .trim()
      .toUpperCase(),
    orderTotal: z
      .number()
      .positive('Order total must be positive')
      .optional(),
  }),
};

// ============================================
// GET COUPON BY CODE VALIDATION
// ============================================
export const getCouponByCodeSchema = {
  params: z.object({
    code: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .trim()
      .toUpperCase(),
  }),
};

// ============================================
// GET COUPON BY ID VALIDATION (ADMIN)
// ============================================
export const getCouponByIdSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid coupon ID'),
  }),
};

// ============================================
// CREATE COUPON VALIDATION (ADMIN)
// ============================================
export const createCouponSchema = {
  body: z.object({
    code: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores')
      .trim()
      .toUpperCase(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    type: z
      .enum(['percentage', 'fixed'], {
        errorMap: () => ({ message: 'Type must be either "percentage" or "fixed"' }),
      }),
    value: z
      .number()
      .int('Value must be an integer')
      .positive('Value must be positive'),
    minOrderValue: z
      .number()
      .int('Minimum order value must be an integer')
      .nonnegative('Minimum order value cannot be negative')
      .optional()
      .nullable(),
    maxDiscount: z
      .number()
      .int('Maximum discount must be an integer')
      .positive('Maximum discount must be positive')
      .optional()
      .nullable(),
    usageLimit: z
      .number()
      .int('Usage limit must be an integer')
      .positive('Usage limit must be positive')
      .optional()
      .nullable(),
    validFrom: z
      .string()
      .datetime('Invalid date format for validFrom')
      .optional(),
    validUntil: z
      .string()
      .datetime('Invalid date format for validUntil'),
    isActive: z
      .boolean()
      .optional()
      .default(true),
  }).refine(
    (data) => {
      // Percentage should be between 1 and 100
      if (data.type === 'percentage' && (data.value < 1 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage value must be between 1 and 100',
      path: ['value'],
    }
  ).refine(
    (data) => {
      // Fixed discount should have a reasonable maximum
      if (data.type === 'fixed' && data.value > 100000) {
        return false;
      }
      return true;
    },
    {
      message: 'Fixed discount value cannot exceed ₹1,00,000',
      path: ['value'],
    }
  ).refine(
    (data) => {
      // validFrom should be before validUntil
      if (data.validFrom) {
        const from = new Date(data.validFrom);
        const until = new Date(data.validUntil);
        return from < until;
      }
      return true;
    },
    {
      message: 'validFrom must be before validUntil',
      path: ['validFrom'],
    }
  ).refine(
    (data) => {
      // maxDiscount only applies to percentage coupons
      if (data.type === 'fixed' && data.maxDiscount) {
        return false;
      }
      return true;
    },
    {
      message: 'maxDiscount only applies to percentage coupons',
      path: ['maxDiscount'],
    }
  ),
};

// ============================================
// UPDATE COUPON VALIDATION (ADMIN)
// ============================================
export const updateCouponSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid coupon ID'),
  }),
  body: z.object({
    code: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .regex(/^[A-Z0-9_-]+$/, 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores')
      .trim()
      .toUpperCase()
      .optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional(),
    type: z
      .enum(['percentage', 'fixed'])
      .optional(),
    value: z
      .number()
      .int('Value must be an integer')
      .positive('Value must be positive')
      .optional(),
    minOrderValue: z
      .number()
      .int('Minimum order value must be an integer')
      .nonnegative('Minimum order value cannot be negative')
      .optional()
      .nullable(),
    maxDiscount: z
      .number()
      .int('Maximum discount must be an integer')
      .positive('Maximum discount must be positive')
      .optional()
      .nullable(),
    usageLimit: z
      .number()
      .int('Usage limit must be an integer')
      .positive('Usage limit must be positive')
      .optional()
      .nullable(),
    validFrom: z
      .string()
      .datetime('Invalid date format for validFrom')
      .optional(),
    validUntil: z
      .string()
      .datetime('Invalid date format for validUntil')
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  }).refine(
    (data) => {
      if (data.type === 'percentage' && data.value && (data.value < 1 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage value must be between 1 and 100',
      path: ['value'],
    }
  ).refine(
    (data) => {
      if (data.type === 'fixed' && data.value && data.value > 100000) {
        return false;
      }
      return true;
    },
    {
      message: 'Fixed discount value cannot exceed ₹1,00,000',
      path: ['value'],
    }
  ),
};

// ============================================
// TOGGLE COUPON STATUS VALIDATION (ADMIN)
// ============================================
export const toggleCouponStatusSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid coupon ID'),
  }),
};

// ============================================
// DELETE COUPON VALIDATION (ADMIN)
// ============================================
export const deleteCouponSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid coupon ID'),
  }),
};

// ============================================
// GET ALL COUPONS VALIDATION (ADMIN)
// ============================================
export const getAllCouponsSchema = {
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('20'),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    type: z
      .enum(['percentage', 'fixed'])
      .optional(),
  }),
};

// ============================================
// GET COUPON STATS VALIDATION (ADMIN)
// ============================================
export const getCouponStatsSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid coupon ID'),
  }),
};