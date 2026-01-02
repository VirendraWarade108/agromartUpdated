import { z } from 'zod';

// ============================================
// ADD TO CART VALIDATION
// ============================================
export const addToCartSchema = {
  body: z.object({
    productId: z
      .string()
      .cuid('Invalid product ID'),
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1')
      .max(100, 'Quantity cannot exceed 100')
      .default(1),
  }),
};

// ============================================
// SYNC CART VALIDATION
// ============================================
export const syncCartSchema = {
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().cuid('Invalid product ID'),
        quantity: z
          .number()
          .int('Quantity must be an integer')
          .positive('Quantity must be at least 1')
          .max(100, 'Quantity cannot exceed 100'),
      })
    ).max(50, 'Cannot sync more than 50 items at once'),
  }),
};

// ============================================
// UPDATE CART ITEM VALIDATION
// ============================================
export const updateCartItemSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid cart item ID'),
  }),
  body: z.object({
    quantity: z
      .number()
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1')
      .max(100, 'Quantity cannot exceed 100'),
  }),
};

// ============================================
// REMOVE FROM CART VALIDATION
// ============================================
export const removeFromCartSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid cart item ID'),
  }),
};

// ============================================
// APPLY COUPON VALIDATION
// ============================================
export const applyCouponSchema = {
  body: z.object({
    code: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .trim()
      .toUpperCase(),
  }),
};

// ============================================
// CHECKOUT VALIDATION
// ============================================
export const checkoutSchema = {
  body: z.object({
    addressId: z
      .string()
      .cuid('Invalid address ID')
      .optional(),
    shippingAddress: z.object({
      fullName: z
        .string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .trim(),
      phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)'),
      addressLine: z
        .string()
        .min(10, 'Address must be at least 10 characters')
        .max(500, 'Address must not exceed 500 characters')
        .trim(),
      city: z
        .string()
        .min(2, 'City must be at least 2 characters')
        .max(100, 'City must not exceed 100 characters')
        .trim(),
      state: z
        .string()
        .min(2, 'State must be at least 2 characters')
        .max(100, 'State must not exceed 100 characters')
        .trim(),
      pincode: z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
      country: z
        .string()
        .min(2, 'Country must be at least 2 characters')
        .max(100, 'Country must not exceed 100 characters')
        .default('India'),
    }).optional(),
    paymentMethod: z
      .enum(['card', 'upi', 'netbanking', 'cod'], {
        errorMap: () => ({ message: 'Invalid payment method' }),
      }),
    couponCode: z
      .string()
      .min(3, 'Coupon code must be at least 3 characters')
      .max(50, 'Coupon code must not exceed 50 characters')
      .trim()
      .toUpperCase()
      .optional(),
  }).refine(
    (data) => {
      if (!data.addressId && !data.shippingAddress) {
        return false;
      }
      return true;
    },
    {
      message: 'Either addressId or shippingAddress must be provided',
      path: ['addressId'],
    }
  ),
};

// ============================================
// GET ORDER BY ID VALIDATION
// ============================================
export const getOrderByIdSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid order ID'),
  }),
};

// ============================================
// CANCEL ORDER VALIDATION
// ============================================
export const cancelOrderSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z
      .string()
      .min(10, 'Cancellation reason must be at least 10 characters')
      .max(500, 'Cancellation reason must not exceed 500 characters')
      .trim()
      .optional(),
  }),
};

// ============================================
// GET USER ORDERS VALIDATION
// ============================================
export const getUserOrdersSchema = {
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n > 0, 'Page must be at least 1')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine((n) => n > 0 && n <= 50, 'Limit must be between 1 and 50')
      .optional()
      .default('10'),
    status: z
      .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      .optional(),
  }),
};

// ============================================
// ADMIN: GET ALL ORDERS VALIDATION
// ============================================
export const getAllOrdersSchema = {
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
    status: z
      .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
      .optional(),
    userId: z
      .string()
      .cuid('Invalid user ID')
      .optional(),
    startDate: z
      .string()
      .datetime('Invalid start date format')
      .optional(),
    endDate: z
      .string()
      .datetime('Invalid end date format')
      .optional(),
  }),
};

// ============================================
// ADMIN: UPDATE ORDER STATUS VALIDATION
// ============================================
export const updateOrderStatusSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid order ID'),
  }),
  body: z.object({
    status: z
      .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], {
        errorMap: () => ({ message: 'Invalid order status' }),
      }),
    trackingInfo: z.object({
      location: z
        .string()
        .min(2, 'Location must be at least 2 characters')
        .max(200, 'Location must not exceed 200 characters')
        .trim()
        .optional(),
      description: z
        .string()
        .min(5, 'Description must be at least 5 characters')
        .max(500, 'Description must not exceed 500 characters')
        .trim(),
      metadata: z
        .record(z.any())
        .optional(),
    }).optional(),
  }),
};