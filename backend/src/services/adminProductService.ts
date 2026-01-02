import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import slugify from 'slugify';

/**
 * Create new product (Admin)
 * Fixed to match actual Prisma schema fields
 */
export const createProduct = async (productData: {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  categoryId: string;
  vendorId?: string;
}) => {
  // Generate slug if not provided
  const slug =
    productData.slug || slugify(productData.name, { lower: true, strict: true });

  // Check if slug already exists
  const existingProduct = await prisma.product.findUnique({
    where: { slug },
  });

  if (existingProduct) {
    throw new AppError('Product with this slug already exists', 400);
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: productData.categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      name: productData.name,
      slug,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      stock: productData.stock,
      images: productData.images as any, // Type assertion for JsonValue
      categoryId: productData.categoryId,
      vendorId: productData.vendorId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      vendor: true,
    },
  });

  return product;
};

/**
 * Update product (Admin)
 */
export const updateProduct = async (
  id: string,
  updateData: {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    stock?: number;
    images?: string[];
    categoryId?: string;
    vendorId?: string;
  }
) => {
  // Check if product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // If slug is being updated, check for conflicts
  if (updateData.slug && updateData.slug !== existingProduct.slug) {
    const slugConflict = await prisma.product.findUnique({
      where: { slug: updateData.slug },
    });

    if (slugConflict) {
      throw new AppError('Product with this slug already exists', 400);
    }
  }

  // If name is being updated but slug is not, generate new slug
  if (updateData.name && !updateData.slug) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  // If category is being updated, verify it exists
  if (updateData.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: updateData.categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // Type assertion for images if present
  const dataToUpdate: any = { ...updateData };
  if (updateData.images) {
    dataToUpdate.images = updateData.images as any;
  }

  // Update product
  const updatedProduct = await prisma.product.update({
    where: { id },
    data: dataToUpdate,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      vendor: true,
    },
  });

  return updatedProduct;
};

/**
 * Delete product (Admin)
 */
export const deleteProduct = async (id: string) => {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          cartItems: true,
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if product is in any active carts or orders
  if (product._count.cartItems > 0) {
    throw new AppError(
      'Cannot delete product. It exists in active carts.',
      400
    );
  }

  if (product._count.orderItems > 0) {
    throw new AppError(
      'Cannot delete product. It has associated orders. Consider marking it out of stock instead.',
      400
    );
  }

  // Delete product
  await prisma.product.delete({
    where: { id },
  });

  return { message: 'Product deleted successfully' };
};

/**
 * Bulk update stock (Admin)
 */
export const bulkUpdateStock = async (
  updates: Array<{ id: string; stock: number }>
) => {
  const results = await Promise.all(
    updates.map(async (update) => {
      try {
        const product = await prisma.product.update({
          where: { id: update.id },
          data: { stock: update.stock },
          select: {
            id: true,
            name: true,
            stock: true,
          },
        });
        return { success: true, product };
      } catch (error) {
        return {
          success: false,
          id: update.id,
          error: 'Product not found or update failed',
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

/**
 * Get low stock products (Admin)
 */
export const getLowStockProducts = async (threshold: number = 10) => {
  const products = await prisma.product.findMany({
    where: {
      stock: {
        lte: threshold,
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      stock: true,
      price: true,
      images: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { stock: 'asc' },
  });

  return products;
};

/**
 * Get out of stock products (Admin)
 */
export const getOutOfStockProducts = async () => {
  const products = await prisma.product.findMany({
    where: {
      stock: 0,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      category: {
        select: {
          name: true,
        },
      },
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return products;
};

/**
 * Get product statistics (Admin)
 */
export const getProductStats = async () => {
  const [totalProducts, lowStock, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 10, gt: 0 } } }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);

  return {
    totalProducts,
    lowStock,
    outOfStock,
    inStock: totalProducts - outOfStock,
  };
};

/**
 * Duplicate product (Admin)
 */
export const duplicateProduct = async (id: string) => {
  const originalProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!originalProduct) {
    throw new AppError('Product not found', 404);
  }

  // Create new slug
  const baseSlug = originalProduct.slug;
  let newSlug = `${baseSlug}-copy`;
  let counter = 1;

  // Ensure unique slug
  while (await prisma.product.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${baseSlug}-copy-${counter}`;
    counter++;
  }

  // Create duplicate
  const duplicatedProduct = await prisma.product.create({
    data: {
      name: `${originalProduct.name} (Copy)`,
      slug: newSlug,
      description: originalProduct.description,
      price: originalProduct.price,
      originalPrice: originalProduct.originalPrice,
      stock: 0, // Start with 0 stock
      images: originalProduct.images as any, // Type assertion for JsonValue
      categoryId: originalProduct.categoryId,
      vendorId: originalProduct.vendorId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      vendor: true,
    },
  });

  return duplicatedProduct;
};