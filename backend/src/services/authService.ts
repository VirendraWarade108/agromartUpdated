import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokenPair, verifyRefreshToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

/**
 * Register new user
 */
export const registerUser = async (data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
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

  // Create empty cart for user
  await prisma.cart.create({
    data: {
      userId: user.id,
    },
  });

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  return {
    user,
    ...tokens,
  };
};

/**
 * Login user
 */
export const loginUser = async (email: string, password: string) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    ...tokens,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  // Verify refresh token
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate new tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  return tokens;
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string) => {
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

  return user;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    fullName?: string;
    phone?: string;
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
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

  return user;
};