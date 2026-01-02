import { Router } from 'express';
import * as wishlistController from '../controllers/Wishlistcontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// WISHLIST ROUTES
// Mounted at /api/users/wishlist in app.ts
// ============================================

/**
 * Get wishlist count
 * GET /api/users/wishlist/count
 * Note: Must come before /:productId to avoid route conflicts
 */
router.get('/count', wishlistController.getWishlistCount);

/**
 * Check if product is in wishlist
 * GET /api/users/wishlist/check/:productId
 */
router.get('/check/:productId', wishlistController.checkWishlist);

/**
 * Move items to cart
 * POST /api/users/wishlist/move-to-cart
 */
router.post('/move-to-cart', wishlistController.moveToCart);

/**
 * Get user's wishlist
 * GET /api/users/wishlist
 */
router.get('/', wishlistController.getWishlist);

/**
 * Add product to wishlist
 * POST /api/users/wishlist
 */
router.post('/', wishlistController.addToWishlist);

/**
 * Clear entire wishlist
 * DELETE /api/users/wishlist
 */
router.delete('/', wishlistController.clearWishlist);

/**
 * Remove product from wishlist
 * DELETE /api/users/wishlist/:productId
 */
router.delete('/:productId', wishlistController.removeFromWishlist);

export default router;