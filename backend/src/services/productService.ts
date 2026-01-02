import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Get all products with filters and pagination
 */
export const getAllProducts = async (filters: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}) => {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
  } = filters;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = limit;

  // Build where clause
  const where: any = {};

  // Category filter
  if (category) {
    where.categoryId = category;
  }

  // Search filter (searches in name and description)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Build orderBy clause
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price-asc') orderBy = { price: 'asc' };
  if (sortBy === 'price-desc') orderBy = { price: 'desc' };
  if (sortBy === 'name') orderBy = { name: 'asc' };
  if (sortBy === 'rating') orderBy = { rating: 'desc' };

  // Get products and total count
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
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
 * Get single product by ID or slug
 */
export const getProductById = async (idOrSlug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          email: true,
          phone: true,
          website: true,
          logo: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  categoryId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId },
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where: { categoryId } }),
  ]);

  return {
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
 * Get featured products (highest rated or newest)
 */
export const getFeaturedProducts = async (limit: number = 8) => {
  const products = await prisma.product.findMany({
    take: limit,
    where: {
      stock: { gt: 0 },
    },
    orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
    },
  });

  return products;
};

/**
 * Get related products (same category, excluding current product)
 */
export const getRelatedProducts = async (
  productId: string,
  limit: number = 4
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product || !product.categoryId) {
    return [];
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      stock: { gt: 0 },
    },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
    },
    orderBy: { rating: 'desc' },
  });

  return relatedProducts;
};

/**
 * Search products
 */
export const searchProducts = async (
  query: string,
  options: { page?: number; limit?: number } = {}
) => {
  return getAllProducts({
    ...options,
    search: query,
  });
};

/**
 * Check and reserve stock atomically for checkout
 */
export const reserveStock = async (items: Array<{ productId: string; quantity: number }>) => {
  return await prisma.$transaction(async (tx) => {
    const reservations = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true },
      });

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (!product.stock || product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (requested: ${item.quantity}, available: ${product.stock || 0})`,
          400
        );
      }

      // Decrement stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      reservations.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    return reservations;
  });
};

/**
 * Restore stock (for cancellations/refunds)
 */
export const restoreStock = async (items: Array<{ productId: string; quantity: number }>) => {
  return await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  });
};