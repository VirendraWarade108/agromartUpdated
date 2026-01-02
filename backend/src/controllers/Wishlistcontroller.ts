import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as wishlistService from '../services/Wishlistservice';

// ============================================
// WISHLIST ENDPOINTS
// ============================================

/**
 * Get user's wishlist
 * GET /api/users/wishlist
 * Query: ?page=1&limit=20 (optional pagination)
 */
export const getWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page, limit } = req.query;

    // Parse and validate pagination params
    let parsedPage: number | undefined;
    let parsedLimit: number | undefined;

    if (page) {
      parsedPage = parseInt(page as string);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Page must be a positive number',
          },
        });
      }
    }

    if (limit) {
      parsedLimit = parseInt(limit as string);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Limit must be between 1 and 100',
          },
        });
      }
    }

    const result = await wishlistService.getUserWishlist(userId, {
      page: parsedPage,
      limit: parsedLimit,
    });

    // Handle paginated vs non-paginated response
    if (typeof result === 'object' && 'items' in result && 'pagination' in result) {
      res.json({
        success: true,
        count: result.items.length,
        data: result.items,
        pagination: result.pagination,
      });
    } else {
      res.json({
        success: true,
        count: Array.isArray(result) ? result.length : 0,
        data: result,
      });
    }
  }
);

/**
 * Add product to wishlist
 * POST /api/users/wishlist
 * Body: { productId }
 */
export const addToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.body;

    // Validate productId
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Valid product ID is required',
        },
      });
    }

    const wishlistItem = await wishlistService.addToWishlist(userId, productId.trim());

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlistItem,
    });
  }
);

/**
 * Remove product from wishlist
 * DELETE /api/users/wishlist/:productId
 */
export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required',
        },
      });
    }

    const result = await wishlistService.removeFromWishlist(userId, productId.trim());

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * Check if product is in wishlist
 * GET /api/users/wishlist/check/:productId
 */
export const checkWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product ID is required',
        },
      });
    }

    const result = await wishlistService.isInWishlist(userId, productId.trim());

    res.json({
      success: true,
      data: result,
    });
  }
);

/**
 * Clear entire wishlist
 * DELETE /api/users/wishlist
 */
export const clearWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const result = await wishlistService.clearWishlist(userId);

    res.json({
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  }
);

/**
 * Get wishlist count
 * GET /api/users/wishlist/count
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
 * POST /api/users/wishlist/move-to-cart
 * Body: { productIds: string[] }
 */
export const moveToCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productIds } = req.body;

    // Validate productIds array
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array is required',
        },
      });
    }

    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array cannot be empty',
        },
      });
    }

    // Validate each productId is a string
    const invalidIds = productIds.filter(
      (id) => typeof id !== 'string' || id.trim() === ''
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All product IDs must be valid strings',
        },
      });
    }

    // Trim all product IDs
    const trimmedIds = productIds.map((id) => id.trim());

    const results = await wishlistService.moveWishlistToCart(userId, trimmedIds);

    res.json({
      success: true,
      message: `${results.added.length} item(s) moved to cart, ${results.failed.length} failed`,
      data: results,
    });
  }
);

/**
 * Bulk add to wishlist
 * POST /api/users/wishlist/bulk-add
 * Body: { productIds: string[] }
 */
export const bulkAddToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productIds } = req.body;

    // Validate productIds array
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array is required',
        },
      });
    }

    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array cannot be empty',
        },
      });
    }

    // Validate each productId is a string
    const invalidIds = productIds.filter(
      (id) => typeof id !== 'string' || id.trim() === ''
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All product IDs must be valid strings',
        },
      });
    }

    // Trim all product IDs
    const trimmedIds = productIds.map((id) => id.trim());

    const results = await wishlistService.bulkAddToWishlist(userId, trimmedIds);

    res.json({
      success: true,
      message: `${results.added.length} item(s) added, ${results.failed.length} failed`,
      data: results,
    });
  }
);

/**
 * Bulk remove from wishlist
 * POST /api/users/wishlist/bulk-remove
 * Body: { productIds: string[] }
 */
export const bulkRemoveFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { productIds } = req.body;

    // Validate productIds array
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array is required',
        },
      });
    }

    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Product IDs array cannot be empty',
        },
      });
    }

    // Validate each productId is a string
    const invalidIds = productIds.filter(
      (id) => typeof id !== 'string' || id.trim() === ''
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'All product IDs must be valid strings',
        },
      });
    }

    // Trim all product IDs
    const trimmedIds = productIds.map((id) => id.trim());

    const result = await wishlistService.bulkRemoveFromWishlist(userId, trimmedIds);

    res.json({
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    });
  }
);