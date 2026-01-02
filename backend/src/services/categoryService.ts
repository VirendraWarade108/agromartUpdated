import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all categories
 */
export const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }, // Count products in each category
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories;
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

/**
 * Get category products
 */
export const getCategoryProducts = async (
  categoryId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Get products
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where: { categoryId } }),
  ]);

  return {
    category,
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create new category (Admin only)
 */
export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
}) => {
  // Check if category with same name exists
  const existing = await prisma.category.findFirst({
    where: { name: { equals: data.name, mode: 'insensitive' } },
  });

  if (existing) {
    throw new AppError('Category with this name already exists', 400);
  }

  const category = await prisma.category.create({
    data,
  });

  return category;
};

/**
 * Update category (Admin only)
 */
export const updateCategory = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
  }
) => {
  // Check if category exists
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Category not found', 404);
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.category.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError('Category with this name already exists', 400);
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return category;
};

/**
 * Delete category (Admin only)
 */
export const deleteCategory = async (id: string) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Check if category has products
  if (category._count.products > 0) {
    throw new AppError(
      'Cannot delete category with products. Remove products first.',
      400
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  return category;
};