import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

/**
 * Get all users (Admin)
 */
export const getAllUsers = async (filters?: {
  isAdmin?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { isAdmin, search, page = 1, limit = 20 } = filters || {};
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (isAdmin !== undefined) where.isAdmin = isAdmin;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID (Admin)
 */
export const getUserById = async (userId: string) => {
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
      addresses: true,
      _count: {
        select: {
          orders: true,
          reviews: true,
          wishlist: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

/**
 * Create user (Admin)
 */
export const createUser = async (userData: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  isAdmin?: boolean;
}) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      fullName: userData.fullName || '',
      phone: userData.phone,
      isAdmin: userData.isAdmin || false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Update user (Admin)
 */
export const updateUser = async (
  userId: string,
  updateData: {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    isAdmin?: boolean;
  }
) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // If email is being updated, check for conflicts
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailConflict = await prisma.user.findUnique({
      where: { email: updateData.email },
    });

    if (emailConflict) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Prepare update data
  const dataToUpdate: any = {};
  if (updateData.email) dataToUpdate.email = updateData.email;
  if (updateData.fullName !== undefined) dataToUpdate.fullName = updateData.fullName;
  if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
  if (updateData.isAdmin !== undefined) dataToUpdate.isAdmin = updateData.isAdmin;
  if (updateData.password) {
    dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isAdmin: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Delete user (Admin)
 */
export const deleteUser = async (userId: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting admin users (optional safety check)
  if (user.isAdmin) {
    throw new AppError('Cannot delete admin users', 403);
  }

  // Check if user has orders
  if (user._count.orders > 0) {
    throw new AppError(
      'Cannot delete user with existing orders. Consider deactivating instead.',
      400
    );
  }

  // Delete user (cascade will delete related data)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'User deleted successfully' };
};

/**
 * Get user statistics (Admin)
 */
export const getUserStats = async () => {
  const [totalUsers, adminUsers, regularUsers, usersThisMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(1)), // First day of current month
        },
      },
    }),
  ]);

  return {
    totalUsers,
    adminUsers,
    regularUsers,
    usersThisMonth,
  };
};

/**
 * Get user activity (Admin)
 */
export const getUserActivity = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [orders, reviews, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.review.findMany({
      where: { userId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  return {
    recentOrders: orders,
    recentReviews: reviews,
    wishlistCount,
  };
};

/**
 * Bulk update admin status (Admin)
 */
export const bulkUpdateAdminStatus = async (
  updates: Array<{ userId: string; isAdmin: boolean }>
) => {
  const results = await Promise.all(
    updates.map(async (update) => {
      try {
        const user = await prisma.user.update({
          where: { id: update.userId },
          data: { isAdmin: update.isAdmin },
          select: {
            id: true,
            fullName: true,
            email: true,
            isAdmin: true,
          },
        });
        return { success: true, user };
      } catch (error) {
        return {
          success: false,
          userId: update.userId,
          error: 'User not found or update failed',
        };
      }
    })
  );

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return {
    total: updates.length,
    succeeded: succeeded.length,
    failed: failed.length,
    results,
  };
};