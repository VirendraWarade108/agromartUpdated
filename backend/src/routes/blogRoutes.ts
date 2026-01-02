import { Router } from 'express';
import * as blogController from '../controllers/blogController';

const router = Router();

/**
 * All blog routes are public (no authentication required)
 */

/**
 * Get all blog posts
 * GET /api/blog
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
 */
router.get('/slug/:slug', blogController.getPostBySlug);

/**
 * Get blog post by ID
 * GET /api/blog/:id
 */
router.get('/:id', blogController.getPostById);

export default router;