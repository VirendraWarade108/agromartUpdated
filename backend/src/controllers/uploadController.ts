import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as uploadService from '../services/uploadService';
import { AppError } from '../middleware/errorHandler';
import { ValidationErrors, ServerErrors } from '../utils/errors';

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate folder parameter
 */
const validateFolder = (folder: string | undefined): 'products' | 'reviews' | 'profiles' => {
  const validFolders = ['products', 'reviews', 'profiles'] as const;
  const defaultFolder = 'products';

  if (!folder) {
    return defaultFolder;
  }

  if (!validFolders.includes(folder as any)) {
    throw new AppError(
      `Invalid folder. Must be one of: ${validFolders.join(', ')}`,
      400,
      'INVALID_FOLDER',
      { validFolders }
    );
  }

  return folder as 'products' | 'reviews' | 'profiles';
};

/**
 * Validate file exists in request
 */
const validateFile = (file: Express.Multer.File | undefined): Express.Multer.File => {
  if (!file) {
    throw ValidationErrors.missingField('file');
  }
  return file;
};

/**
 * Validate files array exists in request
 */
const validateFiles = (files: any): Express.Multer.File[] => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw ValidationErrors.missingField('files');
  }
  return files;
};

/**
 * Validate image type parameter for deletion
 */
const validateImageType = (type: string): 'products' | 'reviews' | 'profiles' => {
  const validTypes = ['products', 'reviews', 'profiles'] as const;

  if (!validTypes.includes(type as any)) {
    throw new AppError(
      `Invalid image type. Must be one of: ${validTypes.join(', ')}`,
      400,
      'INVALID_IMAGE_TYPE',
      { validTypes }
    );
  }

  return type as 'products' | 'reviews' | 'profiles';
};

// ============================================
// GENERIC IMAGE UPLOADS (Frontend compatibility)
// ============================================

/**
 * Upload single image (generic endpoint)
 * POST /api/upload/image
 * Supports folder parameter to specify destination
 */
export const uploadImage = asyncHandler(
  async (req: Request, res: Response) => {
    const file = validateFile(req.file);
    const folder = validateFolder(req.body.folder);

    const result = await uploadService.uploadSingleImage(file, folder);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  }
);

/**
 * Upload multiple images (generic endpoint)
 * POST /api/upload/multiple
 * Supports folder parameter to specify destination
 */
export const uploadMultipleImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = validateFiles(req.files);
    const folder = validateFolder(req.body.folder);

    const result = await uploadService.uploadMultipleImages(files, folder);

    res.status(201).json({
      success: true,
      message: `${result.length} image${result.length === 1 ? '' : 's'} uploaded successfully`,
      data: result,
    });
  }
);

// ============================================
// PRODUCT IMAGE UPLOADS (Admin only)
// ============================================

/**
 * Upload single product image
 * POST /api/upload/product
 */
export const uploadProductImage = asyncHandler(
  async (req: Request, res: Response) => {
    const file = validateFile(req.file);

    const result = await uploadService.uploadSingleImage(file, 'products');

    res.status(201).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: result,
    });
  }
);

/**
 * Upload multiple product images
 * POST /api/upload/products
 */
export const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = validateFiles(req.files);

    const result = await uploadService.uploadMultipleImages(files, 'products');

    res.status(201).json({
      success: true,
      message: `${result.length} product image${result.length === 1 ? '' : 's'} uploaded successfully`,
      data: result,
    });
  }
);

// ============================================
// REVIEW IMAGE UPLOADS (Authenticated users)
// ============================================

/**
 * Upload single review image
 * POST /api/upload/review
 */
export const uploadReviewImage = asyncHandler(
  async (req: Request, res: Response) => {
    const file = validateFile(req.file);

    const result = await uploadService.uploadSingleImage(file, 'reviews');

    res.status(201).json({
      success: true,
      message: 'Review image uploaded successfully',
      data: result,
    });
  }
);

/**
 * Upload multiple review images
 * POST /api/upload/reviews
 */
export const uploadReviewImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = validateFiles(req.files);

    // Limit review images to 5 max
    if (files.length > 5) {
      throw new AppError(
        'Maximum 5 images allowed per review',
        400,
        'TOO_MANY_REVIEW_IMAGES',
        { max: 5, provided: files.length }
      );
    }

    const result = await uploadService.uploadMultipleImages(files, 'reviews');

    res.status(201).json({
      success: true,
      message: `${result.length} review image${result.length === 1 ? '' : 's'} uploaded successfully`,
      data: result,
    });
  }
);

// ============================================
// PROFILE IMAGE UPLOAD (Authenticated users)
// ============================================

/**
 * Upload profile image
 * POST /api/upload/profile
 */
export const uploadProfileImage = asyncHandler(
  async (req: Request, res: Response) => {
    const file = validateFile(req.file);

    // Validate file size for profile images (max 2MB)
    const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      throw new AppError(
        'Profile image must be smaller than 2MB',
        400,
        'FILE_TOO_LARGE',
        { max: '2MB', size: `${(file.size / 1024 / 1024).toFixed(2)}MB` }
      );
    }

    const result = await uploadService.uploadSingleImage(file, 'profiles');

    res.status(201).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: result,
    });
  }
);

// ============================================
// DELETE IMAGE
// ============================================

/**
 * Delete image
 * DELETE /api/upload/:type/:filename
 */
export const deleteImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, filename } = req.params;

    // Validate type
    const validType = validateImageType(type);

    // Validate filename exists
    if (!filename || filename.trim() === '') {
      throw ValidationErrors.missingField('filename');
    }

    // Validate filename format (basic sanitization check)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new AppError(
        'Invalid filename format',
        400,
        'INVALID_FILENAME'
      );
    }

    await uploadService.deleteFile(filename, validType);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  }
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get upload statistics
 * GET /api/admin/upload/stats
 */
export const getUploadStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await uploadService.getUploadStats();

    // Format total size for readability
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    res.json({
      success: true,
      data: {
        ...stats,
        totalSizeFormatted: formatSize(stats.totalSize),
      },
    });
  }
);

/**
 * Clean up old files
 * POST /api/admin/upload/cleanup
 */
export const cleanupOldFiles = asyncHandler(
  async (req: Request, res: Response) => {
    const { daysOld = 30 } = req.body;

    // Validate daysOld parameter
    if (typeof daysOld !== 'number' || daysOld < 1 || daysOld > 365) {
      throw new AppError(
        'daysOld must be a number between 1 and 365',
        400,
        'INVALID_DAYS_OLD',
        { min: 1, max: 365, provided: daysOld }
      );
    }

    const deletedCount = await uploadService.cleanupOldFiles(daysOld);

    res.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} old file${deletedCount === 1 ? '' : 's'}`,
      data: { 
        deletedCount,
        daysOld,
      },
    });
  }
);

/**
 * ============================================
 * CONTROLLER SUMMARY
 * ============================================
 * GENERIC UPLOADS:
 *   POST   /upload/image           - Upload single image (any folder)
 *   POST   /upload/multiple        - Upload multiple images (any folder)
 * 
 * PRODUCT UPLOADS (Admin):
 *   POST   /upload/product         - Upload single product image
 *   POST   /upload/products        - Upload multiple product images
 * 
 * REVIEW UPLOADS (Authenticated):
 *   POST   /upload/review          - Upload single review image
 *   POST   /upload/reviews         - Upload multiple review images (max 5)
 * 
 * PROFILE UPLOADS (Authenticated):
 *   POST   /upload/profile         - Upload profile image (max 2MB)
 * 
 * DELETE:
 *   DELETE /upload/:type/:filename - Delete image
 * 
 * ADMIN:
 *   GET    /admin/upload/stats     - Get upload statistics
 *   POST   /admin/upload/cleanup   - Clean up old files
 * ============================================
 */