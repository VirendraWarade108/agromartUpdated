import { z } from 'zod';

// ============================================
// GET ALL PRODUCTS VALIDATION
// ============================================
export const getAllProductsSchema = {
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0, 'Page must be at least 1')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('12'),
    category: z
      .string()
      .cuid('Invalid category ID')
      .optional(),
    minPrice: z
      .string()
      .regex(/^\d+$/, 'Min price must be a positive number')
      .transform(Number)
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+$/, 'Max price must be a positive number')
      .transform(Number)
      .optional(),
    minRating: z
      .string()
      .regex(/^[0-5](\.\d)?$/, 'Min rating must be between 0 and 5')
      .transform(Number)
      .optional(),
    inStock: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z
      .enum(['price', 'rating', 'createdAt', 'name'])
      .optional(),
    order: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
  }),
};

// ============================================
// GET PRODUCT BY ID VALIDATION
// ============================================
export const getProductByIdSchema = {
  params: z.object({
    id: z
      .string()
      .min(1, 'Product ID or slug is required'),
  }),
};

// ============================================
// SEARCH PRODUCTS VALIDATION
// ============================================
export const searchProductsSchema = {
  query: z.object({
    q: z
      .string()
      .min(1, 'Search query is required')
      .max(200, 'Search query too long'),
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
      .refine((n) => n > 0 && n <= 50, 'Limit must be between 1 and 50')
      .optional()
      .default('12'),
  }),
};

// ============================================
// GET PRODUCTS BY CATEGORY VALIDATION
// ============================================
export const getProductsByCategorySchema = {
  params: z.object({
    categoryId: z
      .string()
      .cuid('Invalid category ID'),
  }),
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
      .default('12'),
  }),
};

// ============================================
// CREATE PRODUCT VALIDATION (ADMIN)
// ============================================
export const createProductSchema = {
  body: z.object({
    name: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(200, 'Product name must not exceed 200 characters')
      .trim(),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(200, 'Slug must not exceed 200 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .trim(),
    price: z
      .number()
      .int('Price must be an integer')
      .positive('Price must be positive'),
    originalPrice: z
      .number()
      .int('Original price must be an integer')
      .positive('Original price must be positive')
      .optional()
      .nullable(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must not exceed 5000 characters')
      .optional()
      .nullable(),
    image: z
      .string()
      .url('Invalid image URL')
      .optional()
      .nullable(),
    images: z
      .array(z.string().url('Invalid image URL'))
      .optional()
      .nullable(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative')
      .optional()
      .default(0),
    categoryId: z
      .string()
      .cuid('Invalid category ID')
      .optional()
      .nullable(),
    vendorId: z
      .string()
      .cuid('Invalid vendor ID')
      .optional()
      .nullable(),
  }).refine(
    (data) => {
      if (data.originalPrice && data.originalPrice < data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Original price must be greater than or equal to sale price',
      path: ['originalPrice'],
    }
  ),
};

// ============================================
// UPDATE PRODUCT VALIDATION (ADMIN)
// ============================================
export const updateProductSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid product ID'),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, 'Product name must be at least 3 characters')
      .max(200, 'Product name must not exceed 200 characters')
      .trim()
      .optional(),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(200, 'Slug must not exceed 200 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .trim()
      .optional(),
    price: z
      .number()
      .int('Price must be an integer')
      .positive('Price must be positive')
      .optional(),
    originalPrice: z
      .number()
      .int('Original price must be an integer')
      .positive('Original price must be positive')
      .optional()
      .nullable(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description must not exceed 5000 characters')
      .optional()
      .nullable(),
    image: z
      .string()
      .url('Invalid image URL')
      .optional()
      .nullable(),
    images: z
      .array(z.string().url('Invalid image URL'))
      .optional()
      .nullable(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative')
      .optional(),
    categoryId: z
      .string()
      .cuid('Invalid category ID')
      .optional()
      .nullable(),
    vendorId: z
      .string()
      .cuid('Invalid vendor ID')
      .optional()
      .nullable(),
  }).refine(
    (data) => {
      if (data.originalPrice && data.price && data.originalPrice < data.price) {
        return false;
      }
      return true;
    },
    {
      message: 'Original price must be greater than or equal to sale price',
      path: ['originalPrice'],
    }
  ),
};

// ============================================
// DELETE PRODUCT VALIDATION (ADMIN)
// ============================================
export const deleteProductSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid product ID'),
  }),
};