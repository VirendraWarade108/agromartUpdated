import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { hashPassword, comparePassword } from '../utils/bcrypt';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  }
);

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { fullName, phone, email } = req.body;

    // Build update data
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppError('Email already in use', 400);
      }

      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  }
);

/**
 * Change password
 * PUT /api/users/password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }
);

/**
 * Get user's order history
 * GET /api/users/orders
 */
export const getOrderHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
    });
  }
);