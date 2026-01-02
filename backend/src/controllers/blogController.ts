import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as blogService from '../services/blogService';

// ============================================
// PUBLIC ENDPOINTS (NO AUTH REQUIRED)
// ============================================

/**
 * Get all published blog posts
 * GET /api/blog
 * Query params: page, limit, category, featured, sortBy, sortOrder
 */
export const getAllPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      category,
      featured,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await blogService.getAllPosts({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      sortBy: sortBy as 'publishedAt' | 'views' | 'likes',
      sortOrder: sortOrder as 'asc' | 'desc',
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
 * Query params: limit (default: 4)
 */
export const getFeaturedPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit = 4 } = req.query;
    const posts = await blogService.getFeaturedPosts(Number(limit));

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

// ============================================
// ADMIN ENDPOINTS (REQUIRE ADMIN AUTH)
// ============================================

/**
 * Get all blog posts (including drafts) - ADMIN ONLY
 * GET /api/blog/admin
 * Query params: page, limit, category, published, featured, sortBy, sortOrder
 */
export const getAllPostsAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      category,
      published,
      featured,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await blogService.getAllPostsAdmin({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      sortBy: sortBy as 'publishedAt' | 'views' | 'likes' | 'updatedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    });
  }
);

/**
 * Get single blog post by ID (including drafts) - ADMIN ONLY
 * GET /api/blog/admin/:id
 */
export const getPostByIdAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await blogService.getPostByIdAdmin(id);

    res.json({
      success: true,
      data: post,
    });
  }
);

/**
 * Create blog post - ADMIN ONLY
 * POST /api/blog/admin
 * Body: {
 *   title: string,
 *   slug?: string,
 *   excerpt: string,
 *   content: string,
 *   author: string,
 *   featuredImage?: string,
 *   category: string,
 *   tags: string[],
 *   readingTime?: number,
 *   featured?: boolean,
 *   published?: boolean
 * }
 */
export const createPost = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      featuredImage,
      category,
      tags,
      readingTime,
      featured,
      published,
    } = req.body;

    // Validate required fields
    if (!title || !excerpt || !content || !author || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, excerpt, content, author, category',
      });
    }

    // Validate tags is array
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array',
      });
    }

    const post = await blogService.createPost({
      title,
      slug,
      excerpt,
      content,
      author,
      featuredImage,
      category,
      tags: tags || [],
      readingTime,
      featured,
      published,
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Blog post created successfully',
    });
  }
);

/**
 * Update blog post - ADMIN ONLY
 * PUT /api/blog/admin/:id
 * Body: Partial<BlogPost>
 */
export const updatePost = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      featuredImage,
      category,
      tags,
      readingTime,
      featured,
      published,
    } = req.body;

    // Validate at least one field is provided
    if (
      !title &&
      !slug &&
      !excerpt &&
      !content &&
      !author &&
      featuredImage === undefined &&
      !category &&
      !tags &&
      readingTime === undefined &&
      featured === undefined &&
      published === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update',
      });
    }

    // Validate tags is array if provided
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be an array',
      });
    }

    const post = await blogService.updatePost(id, {
      title,
      slug,
      excerpt,
      content,
      author,
      featuredImage,
      category,
      tags,
      readingTime,
      featured,
      published,
    });

    res.json({
      success: true,
      data: post,
      message: 'Blog post updated successfully',
    });
  }
);

/**
 * Delete blog post - ADMIN ONLY
 * DELETE /api/blog/admin/:id
 */
export const deletePost = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await blogService.deletePost(id);

    res.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  }
);

/**
 * Toggle publish status - ADMIN ONLY
 * PATCH /api/blog/admin/:id/toggle-publish
 */
export const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await blogService.togglePublishStatus(id);

    res.json({
      success: true,
      data: post,
      message: `Blog post ${post.published ? 'published' : 'unpublished'} successfully`,
    });
  }
);

/**
 * Get blog statistics - ADMIN ONLY
 * GET /api/blog/admin/stats
 */
export const getBlogStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await blogService.getBlogStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);