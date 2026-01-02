import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminUserService from '../services/adminUserService';

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { isAdmin, search, page, limit } = req.query;

    const result = await adminUserService.getAllUsers({
      isAdmin: isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  }
);

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await adminUserService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  }
);

/**
 * Create user
 * POST /api/admin/users
 */
export const createUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, fullName, phone, isAdmin } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await adminUserService.createUser({
      email,
      password,
      fullName,
      phone,
      isAdmin,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  }
);

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, password, fullName, phone, isAdmin } = req.body;

    const user = await adminUserService.updateUser(id, {
      email,
      password,
      fullName,
      phone,
      isAdmin,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  }
);

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await adminUserService.deleteUser(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
export const getUserStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await adminUserService.getUserStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Get user activity
 * GET /api/admin/users/:id/activity
 */
export const getUserActivity = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const activity = await adminUserService.getUserActivity(id);

    res.json({
      success: true,
      data: activity,
    });
  }
);

/**
 * Bulk update admin status
 * PUT /api/admin/users/bulk-admin
 */
export const bulkUpdateAdminStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    const result = await adminUserService.bulkUpdateAdminStatus(updates);

    res.json({
      success: true,
      message: `Bulk update completed. ${result.succeeded} succeeded, ${result.failed} failed.`,
      data: result,
    });
  }
);