import { z } from 'zod';

// ============================================
// REGISTER VALIDATION
// ============================================
export const registerSchema = {
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
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
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
};

// ============================================
// LOGIN VALIDATION
// ============================================
export const loginSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
};

// ============================================
// REFRESH TOKEN VALIDATION
// ============================================
export const refreshSchema = {
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
};

// ============================================
// UPDATE PROFILE VALIDATION
// ============================================
export const updateProfileSchema = {
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)')
      .optional()
      .nullable(),
    currentPassword: z
      .string()
      .min(1, 'Current password is required when changing password')
      .optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .optional(),
  }).refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Current password is required when changing password',
      path: ['currentPassword'],
    }
  ),
};

// ============================================
// PASSWORD RESET REQUEST VALIDATION
// ============================================
export const resetPasswordRequestSchema = {
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .toLowerCase()
      .trim(),
  }),
};

// ============================================
// PASSWORD RESET VALIDATION
// ============================================
export const resetPasswordSchema = {
  body: z.object({
    token: z
      .string()
      .min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
};