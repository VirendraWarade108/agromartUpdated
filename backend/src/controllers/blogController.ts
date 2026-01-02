import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as blogService from '../services/blogService';

/**
 * Get all blog posts
 * GET /api/blog
 */
export const getAllPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, category } = req.query;
    
    const result = await blogService.getAllPosts({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
    });
    
    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    });
  }
);

/**
 * Get blog post by ID
 * GET /api/blog/:id
 */
export const getPostById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await blogService.getPostById(id);
    
    res.json({
      success: true,
      data: post,
    });
  }
);

/**
 * Get blog post by slug
 * GET /api/blog/slug/:slug
 */
export const getPostBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);
    
    res.json({
      success: true,
      data: post,
    });
  }
);

/**
 * Get blog categories
 * GET /api/blog/categories
 */
export const getCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await blogService.getCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  }
);

/**
 * Get featured blog posts
 * GET /api/blog/featured
 */
export const getFeaturedPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const posts = await blogService.getFeaturedPosts();
    
    res.json({
      success: true,
      data: posts,
    });
  }
);

/**
 * Search blog posts
 * GET /api/blog/search?q=query
 */
export const searchPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const results = await blogService.searchPosts(q);
    
    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  }
);