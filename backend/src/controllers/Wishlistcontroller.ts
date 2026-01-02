import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as wishlistService from '../services/Wishlistservice';

// ============================================
// WISHLIST ENDPOINTS
// ============================================

/**
 * Get user's wishlist
 * GET /api/wishlist
 */
export const getWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const wishlist = await wishlistService.getUserWishlist(userId);

    res.json({
      success: true,
      count: wishlist.length,
      data: wishlist,
    });
  }
);

/**
 * Add product to wishlist
 * POST /api/wishlist
 */
export const addToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const wishlistItem = await wishlistService.addToWishlist(userId, productId);

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlistItem,
    });
  }
);

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/:productId
 */
export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params;

    const result = await wishlistService.removeFromWishlist(userId, productId);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * Check if product is in wishlist
 * GET /api/wishlist/check/:productId
 */
export const checkWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params;

    const result = await wishlistService.isInWishlist(userId, productId);

    res.json({
      success: true,
      data: result,
    });
  }
);

/**
 * Clear entire wishlist
 * DELETE /api/wishlist
 */
export const clearWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const result = await wishlistService.clearWishlist(userId);

    res.json({
      success: true,
      message: result.message,
      deletedCount: result.deletedCount,
    });
  }
);

/**
 * Get wishlist count
 * GET /api/wishlist/count
 */
export const getWishlistCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const result = await wishlistService.getWishlistCount(userId);

    res.json({
      success: true,
      data: result,
    });
  }
);

/**
 * Move items from wishlist to cart
 * POST /api/wishlist/move-to-cart
 */
export const moveToCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required',
      });
    }

    const results = await wishlistService.moveWishlistToCart(userId, productIds);

    res.json({
      success: true,
      message: `${results.added.length} items moved to cart, ${results.failed.length} failed`,
      data: results,
    });
  }
);