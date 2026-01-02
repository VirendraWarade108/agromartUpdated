import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as authService from '../services/authService';
import * as cartService from '../services/cartService';
import { env } from '../config/env';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password } = req.body;

  const result = await authService.registerUser({
    fullName,
    email,
    phone,
    password,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  // Check for guest cart cookie and merge if exists
  const guestCartId = req.cookies?.guestCartId;
  if (guestCartId) {
    try {
      await cartService.mergeGuestCart(result.user.id, guestCartId);
      // Clear guest cart cookie
      res.clearCookie('guestCartId');
    } catch (error) {
      // Merge failed, but login succeeded - continue
      console.error('Failed to merge guest cart:', error);
    }
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: tokens,
  });
});

/**
 * Get current user profile
 * GET /api/auth/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await authService.getUserProfile(userId);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { fullName, phone } = req.body;

  const user = await authService.updateUserProfile(userId, {
    fullName,
    phone,
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * Logout (client-side token removal, no backend action needed)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});