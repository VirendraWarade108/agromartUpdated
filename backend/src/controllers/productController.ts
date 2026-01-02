import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as productService from '../services/productService';

/**
 * Get all products
 * GET /api/products
 */
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy,
  } = req.query;

  const result = await productService.getAllProducts({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    category: category as string,
    search: search as string,
    minPrice: minPrice ? parseInt(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
    sortBy: sortBy as string,
  });

  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

/**
 * Get single product by ID or slug
 * GET /api/products/:id
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await productService.getProductById(id);

  res.json({
    success: true,
    data: product,
  });
});

/**
 * Get products by category
 * GET /api/products/category/:categoryId
 */
export const getProductsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const { page, limit } = req.query;

    const result = await productService.getProductsByCategory(categoryId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  }
);

/**
 * Get featured products
 * GET /api/products/featured
 */
export const getFeaturedProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit } = req.query;

    const products = await productService.getFeaturedProducts(
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: products,
    });
  }
);

/**
 * Get related products
 * GET /api/products/:id/related
 */
export const getRelatedProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit } = req.query;

    const products = await productService.getRelatedProducts(
      id,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: products,
    });
  }
);

/**
 * Search products
 * GET /api/products/search
 */
export const searchProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { q, page, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await productService.searchProducts(q as string, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  }
);