import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as categoryService from '../services/categoryService';

/**
 * Get all categories
 * GET /api/categories
 */
export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    res.json({
      success: true,
      data: categories,
    });
  }
);

/**
 * Get single category by ID
 * GET /api/categories/:id
 */
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await categoryService.getCategoryById(id);

    res.json({
      success: true,
      data: category,
    });
  }
);

/**
 * Get category products
 * GET /api/categories/:id/products
 */
export const getCategoryProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await categoryService.getCategoryProducts(id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.products,
      category: result.category,
      pagination: result.pagination,
    });
  }
);

/**
 * Create new category (Admin only)
 * POST /api/admin/categories
 */
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description, icon } = req.body;

    const category = await categoryService.createCategory({
      name,
      description,
      icon,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  }
);

/**
 * Update category (Admin only)
 * PUT /api/admin/categories/:id
 */
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = await categoryService.updateCategory(id, {
      name,
      description,
      icon,
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  }
);

/**
 * Delete category (Admin only)
 * DELETE /api/admin/categories/:id
 */
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: category,
    });
  }
);