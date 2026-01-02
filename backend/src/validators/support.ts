import { z } from 'zod';

// ============================================
// SUBMIT CONTACT MESSAGE VALIDATION
// ============================================
export const submitContactMessageSchema = {
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)')
      .optional(),
    subject: z
      .string()
      .min(5, 'Subject must be at least 5 characters')
      .max(200, 'Subject must not exceed 200 characters')
      .trim(),
    message: z
      .string()
      .min(20, 'Message must be at least 20 characters')
      .max(2000, 'Message must not exceed 2000 characters')
      .trim(),
  }),
};

// ============================================
// SUBSCRIBE TO NEWSLETTER VALIDATION
// ============================================
export const subscribeToNewsletterSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
  }),
};

// ============================================
// UNSUBSCRIBE FROM NEWSLETTER VALIDATION
// ============================================
export const unsubscribeFromNewsletterSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
  }),
};

// ============================================
// GET FAQ BY ID VALIDATION
// ============================================
export const getFAQByIdSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid FAQ ID'),
  }),
};

// ============================================
// GET ALL FAQS VALIDATION
// ============================================
export const getAllFAQsSchema = {
  query: z.object({
    category: z
      .string()
      .min(2, 'Category must be at least 2 characters')
      .max(50, 'Category must not exceed 50 characters')
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
};

// ============================================
// CREATE FAQ VALIDATION (ADMIN)
// ============================================
export const createFAQSchema = {
  body: z.object({
    question: z
      .string()
      .min(10, 'Question must be at least 10 characters')
      .max(500, 'Question must not exceed 500 characters')
      .trim(),
    answer: z
      .string()
      .min(10, 'Answer must be at least 10 characters')
      .max(2000, 'Answer must not exceed 2000 characters')
      .trim(),
    category: z
      .string()
      .min(2, 'Category must be at least 2 characters')
      .max(50, 'Category must not exceed 50 characters')
      .trim(),
    order: z
      .number()
      .int('Order must be an integer')
      .nonnegative('Order cannot be negative')
      .optional()
      .default(0),
    isActive: z
      .boolean()
      .optional()
      .default(true),
  }),
};

// ============================================
// UPDATE FAQ VALIDATION (ADMIN)
// ============================================
export const updateFAQSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid FAQ ID'),
  }),
  body: z.object({
    question: z
      .string()
      .min(10, 'Question must be at least 10 characters')
      .max(500, 'Question must not exceed 500 characters')
      .trim()
      .optional(),
    answer: z
      .string()
      .min(10, 'Answer must be at least 10 characters')
      .max(2000, 'Answer must not exceed 2000 characters')
      .trim()
      .optional(),
    category: z
      .string()
      .min(2, 'Category must be at least 2 characters')
      .max(50, 'Category must not exceed 50 characters')
      .trim()
      .optional(),
    order: z
      .number()
      .int('Order must be an integer')
      .nonnegative('Order cannot be negative')
      .optional(),
    isActive: z
      .boolean()
      .optional(),
  }),
};

// ============================================
// DELETE FAQ VALIDATION (ADMIN)
// ============================================
export const deleteFAQSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid FAQ ID'),
  }),
};

// ============================================
// GET ALL CONTACT MESSAGES VALIDATION (ADMIN)
// ============================================
export const getAllContactMessagesSchema = {
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
      .enum(['pending', 'in-progress', 'resolved', 'closed'])
      .optional(),
  }),
};

// ============================================
// UPDATE MESSAGE STATUS VALIDATION (ADMIN)
// ============================================
export const updateMessageStatusSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid message ID'),
  }),
  body: z.object({
    status: z
      .enum(['pending', 'in-progress', 'resolved', 'closed'], {
        errorMap: () => ({ message: 'Invalid status value' }),
      }),
  }),
};

// ============================================
// DELETE CONTACT MESSAGE VALIDATION (ADMIN)
// ============================================
export const deleteContactMessageSchema = {
  params: z.object({
    id: z
      .string()
      .cuid('Invalid message ID'),
  }),
};

// ============================================
// GET ALL SUBSCRIBERS VALIDATION (ADMIN)
// ============================================
export const getAllSubscribersSchema = {
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
  }),
};