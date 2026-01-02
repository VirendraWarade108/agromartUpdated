import { Router } from 'express';
import * as wishlistController from '../controllers/Wishlistcontroller';
import { authenticate } from '../middleware/auth';

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================
router.use(authenticate);

// ============================================
// WISHLIST ROUTES
// Mounted at /api/users/wishlist in app.ts
// ============================================

/**
 * Get wishlist count
 * GET /api/users/wishlist/count
 * IMPORTANT: Must come before other routes to avoid conflicts
 */
router.get('/count', wishlistController.getWishlistCount);

/**
 * Check if product is in wishlist
 * GET /api/users/wishlist/check/:productId
 */
router.get('/check/:productId', wishlistController.checkWishlist);

/**
 * Move items to cart (bulk operation)
 * POST /api/users/wishlist/move-to-cart
 * Body: { productIds: string[] }
 */
router.post('/move-to-cart', wishlistController.moveToCart);

/**
 * Bulk add to wishlist
 * POST /api/users/wishlist/bulk-add
 * Body: { productIds: string[] }
 */
router.post('/bulk-add', wishlistController.bulkAddToWishlist);

/**
 * Bulk remove from wishlist
 * POST /api/users/wishlist/bulk-remove
 * Body: { productIds: string[] }
 */
router.post('/bulk-remove', wishlistController.bulkRemoveFromWishlist);

/**
 * Get user's wishlist
 * GET /api/users/wishlist
 * Query: ?page=1&limit=20 (optional pagination)
 */
router.get('/', wishlistController.getWishlist);

/**
 * Add product to wishlist
 * POST /api/users/wishlist
 * Body: { productId: string }
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