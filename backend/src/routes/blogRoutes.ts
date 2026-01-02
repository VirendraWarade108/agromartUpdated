import { Router } from 'express';
import * as blogController from '../controllers/blogController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
// ============================================

/**
 * Get all published blog posts
 * GET /api/blog
 * Query: page, limit, category, featured, sortBy, sortOrder
 */
router.get('/', blogController.getAllPosts);

/**
 * Get blog categories
 * GET /api/blog/categories
 */
router.get('/categories', blogController.getCategories);

/**
 * Get featured blog posts
 * GET /api/blog/featured
 * Query: limit (default: 4)
 */
router.get('/featured', blogController.getFeaturedPosts);

/**
 * Search blog posts
 * GET /api/blog/search?q=query
 */
router.get('/search', blogController.searchPosts);

/**
 * Get blog post by slug
 * GET /api/blog/slug/:slug
 * NOTE: This must come before /:id to avoid conflicts
 */
router.get('/slug/:slug', blogController.getPostBySlug);

/**
 * Get blog post by ID
 * GET /api/blog/:id
 */
router.get('/:id', blogController.getPostById);

// ============================================
// ADMIN ROUTES (REQUIRE AUTHENTICATION + ADMIN ROLE)
// ============================================

/**
 * Get blog statistics
 * GET /api/blog/admin/stats
 * Auth: Admin only
 * NOTE: This must come before /admin/:id to avoid conflicts
 */
router.get('/admin/stats', authenticate, requireAdmin, blogController.getBlogStats);

/**
 * Get all blog posts (including drafts)
 * GET /api/blog/admin
 * Auth: Admin only
 * Query: page, limit, category, published, featured, sortBy, sortOrder
 */
router.get('/admin', authenticate, requireAdmin, blogController.getAllPostsAdmin);

/**
 * Get single blog post by ID (including drafts)
 * GET /api/blog/admin/:id
 * Auth: Admin only
 */
router.get('/admin/:id', authenticate, requireAdmin, blogController.getPostByIdAdmin);

/**
 * Create blog post
 * POST /api/blog/admin
 * Auth: Admin only
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
router.post('/admin', authenticate, requireAdmin, blogController.createPost);

/**
 * Update blog post
 * PUT /api/blog/admin/:id
 * Auth: Admin only
 * Body: Partial<BlogPost>
 */
router.put('/admin/:id', authenticate, requireAdmin, blogController.updatePost);

/**
 * Toggle publish status
 * PATCH /api/blog/admin/:id/toggle-publish
 * Auth: Admin only
 */
router.patch('/admin/:id/toggle-publish', authenticate, requireAdmin, blogController.togglePublishStatus);

/**
 * Delete blog post
 * DELETE /api/blog/admin/:id
 * Auth: Admin only
 */
router.delete('/admin/:id', authenticate, requireAdmin, blogController.deletePost);

// ============================================
// ROUTE SUMMARY
// ============================================
/*
PUBLIC ROUTES:
  GET    /api/blog                    - Get all published posts
  GET    /api/blog/categories         - Get categories
  GET    /api/blog/featured           - Get featured posts
  GET    /api/blog/search             - Search posts
  GET    /api/blog/slug/:slug         - Get post by slug
  GET    /api/blog/:id                - Get post by ID

ADMIN ROUTES (require authentication + admin role):
  GET    /api/blog/admin/stats        - Get blog statistics
  GET    /api/blog/admin              - Get all posts (including drafts)
  GET    /api/blog/admin/:id          - Get post by ID (including drafts)
  POST   /api/blog/admin              - Create blog post
  PUT    /api/blog/admin/:id          - Update blog post
  PATCH  /api/blog/admin/:id/toggle-publish - Toggle publish status
  DELETE /api/blog/admin/:id          - Delete blog post
*/

export default router;