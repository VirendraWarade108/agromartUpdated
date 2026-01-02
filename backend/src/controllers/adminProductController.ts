import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminProductService from '../services/adminProductService';

// ============================================
// ADMIN PRODUCT CRUD
// ============================================

/**
 * Create new product
 * POST /api/admin/products
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      slug,
      description,
      price,
      originalPrice,
      stock,
      images,
      categoryId,
      vendorId,
    } = req.body;

    // Validate required fields
    if (!name || !price || stock === undefined || !images || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, stock, images, and categoryId are required',
      });
    }

    const product = await adminProductService.createProduct({
      name,
      slug,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      stock: parseInt(stock),
      images,
      categoryId,
      vendorId,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  }
);

/**
 * Update product
 * PUT /api/admin/products/:id
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Parse numeric fields if present
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice)
      updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    const product = await adminProductService.updateProduct(id, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  }
);

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await adminProductService.deleteProduct(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * Bulk update stock
 * PUT /api/admin/products/stock/bulk
 */
export const bulkUpdateStock = asyncHandler(
  async (req: Request, res: Response) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    const result = await adminProductService.bulkUpdateStock(updates);

    res.json({
      success: true,
      message: `Bulk update completed. ${result.succeeded} succeeded, ${result.failed} failed.`,
      data: result,
    });
  }
);

/**
 * Get low stock products
 * GET /api/admin/products/stock/low
 */
export const getLowStockProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string)
      : 10;

    const products = await adminProductService.getLowStockProducts(threshold);

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  }
);

/**
 * Get out of stock products
 * GET /api/admin/products/stock/out
 */
export const getOutOfStockProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const products = await adminProductService.getOutOfStockProducts();

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  }
);

/**
 * Get product statistics
 * GET /api/admin/products/stats
 */
export const getProductStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await adminProductService.getProductStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Duplicate product
 * POST /api/admin/products/:id/duplicate
 */
export const duplicateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await adminProductService.duplicateProduct(id);

    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: product,
    });
  }
);