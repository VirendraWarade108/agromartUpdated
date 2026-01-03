import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';

// ============================================
// SECURITY CONSTANTS
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_UPLOAD = 10;

// Whitelist of allowed MIME types
const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Whitelist of allowed file extensions
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Blacklist of dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html', '.htm',
  '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb',
];

// ============================================
// DIRECTORY SETUP
// ============================================

const uploadDir = path.join(__dirname, '../../uploads');
const productImagesDir = path.join(uploadDir, 'products');
const reviewImagesDir = path.join(uploadDir, 'reviews');
const profileImagesDir = path.join(uploadDir, 'profiles');

// Create directories if they don't exist
[uploadDir, productImagesDir, reviewImagesDir, profileImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
});

// ============================================
// SECURITY FUNCTIONS
// ============================================

/**
 * Generate cryptographically secure random filename
 * Prevents path traversal and collision attacks
 */
const generateSecureFileName = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  
  // Validate extension
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new AppError(
      `File extension '${ext}' not allowed. Allowed: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
      400,
      'INVALID_FILE_EXTENSION'
    );
  }

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new AppError(
      'File type not allowed for security reasons',
      400,
      'DANGEROUS_FILE_TYPE'
    );
  }

  // Generate secure random name
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  // Sanitize extension (remove any dangerous characters)
  const sanitizedExt = ext.replace(/[^a-z0-9.]/gi, '');
  
  return `${timestamp}-${randomString}${sanitizedExt}`;
};

/**
 * Validate file mime type (defense in depth)
 * Checks both extension and mime type
 */
const validateFileMime = (file: Express.Multer.File): void => {
  // Check MIME type
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    throw new AppError(
      `File type '${file.mimetype}' not allowed. Allowed types: jpg, jpeg, png, gif, webp`,
      400,
      'INVALID_MIME_TYPE'
    );
  }

  // Check extension matches mime type
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
  };

  const expectedExtensions = mimeToExt[file.mimetype] || [];
  if (!expectedExtensions.includes(ext)) {
    throw new AppError(
      'File extension does not match file type',
      400,
      'EXTENSION_MISMATCH'
    );
  }
};

/**
 * Sanitize filename to prevent path traversal
 */
const sanitizeFileName = (filename: string): string => {
  // Remove any path separators and null bytes
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '');
};

/**
 * Determine destination folder based on upload type
 */
const getDestinationFolder = (req: Request): string => {
  const requestPath = req.path.toLowerCase();
  
  if (requestPath.includes('/product')) {
    return productImagesDir;
  } else if (requestPath.includes('/review')) {
    return reviewImagesDir;
  } else if (requestPath.includes('/profile')) {
    return profileImagesDir;
  }
  
  // Default fallback
  return productImagesDir;
};

// ============================================
// MULTER CONFIGURATION
// ============================================

/**
 * Multer storage configuration with security enhancements
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dest = getDestinationFolder(req);
      cb(null, dest);
    } catch (error: any) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    try {
      // Sanitize original filename first
      const sanitized = sanitizeFileName(file.originalname);
      const fileName = generateSecureFileName(sanitized);
      cb(null, fileName);
    } catch (error: any) {
      cb(error, '');
    }
  },
});

/**
 * File filter with comprehensive validation
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  try {
    // Validate MIME type
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      return cb(
        new AppError(
          'Only image files are allowed (jpg, jpeg, png, gif, webp)',
          400,
          'INVALID_FILE_TYPE'
        )
      );
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return cb(
        new AppError(
          `File extension '${ext}' not allowed`,
          400,
          'INVALID_FILE_EXTENSION'
        )
      );
    }

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return cb(
        new AppError(
          'File type not allowed for security reasons',
          400,
          'DANGEROUS_FILE_TYPE'
        )
      );
    }

    // Check for null bytes in filename (path traversal attempt)
    if (file.originalname.includes('\0')) {
      return cb(
        new AppError(
          'Invalid filename',
          400,
          'INVALID_FILENAME'
        )
      );
    }

    cb(null, true);
  } catch (error: any) {
    cb(error);
  }
};

/**
 * Multer upload middleware with security limits
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD,
    fieldNameSize: 100, // Limit field name length
    fieldSize: 1024 * 1024, // 1MB for field values
    fields: 10, // Max number of non-file fields
  },
});

// ============================================
// FILE URL GENERATION
// ============================================

/**
 * Get file URL with validation
 */
export const getFileUrl = (
  filename: string,
  type: 'products' | 'reviews' | 'profiles'
): string => {
  // Validate filename
  const sanitized = sanitizeFileName(filename);
  
  // Ensure filename doesn't contain path traversal
  if (sanitized !== filename || filename.includes('..') || filename.includes('/')) {
    throw new AppError('Invalid filename', 400, 'INVALID_FILENAME');
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}/${sanitized}`;
};

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Delete file from disk with validation
 */
export const deleteFile = async (
  filename: string,
  type: 'products' | 'reviews' | 'profiles'
): Promise<void> => {
  // Sanitize filename
  const sanitized = sanitizeFileName(filename);
  
  // Validate filename
  if (sanitized !== filename) {
    throw new AppError('Invalid filename', 400, 'INVALID_FILENAME');
  }

  // Construct safe file path
  const filePath = path.join(uploadDir, type, sanitized);
  
  // Ensure file path is within upload directory (prevent path traversal)
  const realPath = fs.realpathSync(uploadDir);
  const targetPath = path.resolve(filePath);
  
  if (!targetPath.startsWith(realPath)) {
    throw new AppError('Invalid file path', 400, 'INVALID_FILE_PATH');
  }

  // Delete file if exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Upload single image with validation
 */
export const uploadSingleImage = async (
  file: Express.Multer.File | undefined,
  type: 'products' | 'reviews' | 'profiles'
): Promise<{ filename: string; url: string; size: number }> => {
  if (!file) {
    throw new AppError('No file provided', 400, 'NO_FILE');
  }

  // Additional validation after upload
  validateFileMime(file);

  return {
    filename: file.filename,
    url: getFileUrl(file.filename, type),
    size: file.size,
  };
};

/**
 * Upload multiple images with validation
 */
export const uploadMultipleImages = async (
  files: Express.Multer.File[] | undefined,
  type: 'products' | 'reviews' | 'profiles'
): Promise<Array<{ filename: string; url: string; size: number }>> => {
  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400, 'NO_FILES');
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new AppError(
      `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} files allowed`,
      400,
      'TOO_MANY_FILES'
    );
  }

  // Validate all files
  files.forEach(validateFileMime);

  return files.map((file) => ({
    filename: file.filename,
    url: getFileUrl(file.filename, type),
    size: file.size,
  }));
};

// ============================================
// ADMIN UTILITIES
// ============================================

/**
 * Get upload statistics
 */
export const getUploadStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  filesByType: {
    products: number;
    reviews: number;
    profiles: number;
  };
}> => {
  const getDirectoryStats = (dir: string) => {
    if (!fs.existsSync(dir)) return { count: 0, size: 0 };

    const files = fs.readdirSync(dir);
    const size = files.reduce((total, file) => {
      const filePath = path.join(dir, file);
      
      // Skip if not a file
      if (!fs.statSync(filePath).isFile()) return total;
      
      const stats = fs.statSync(filePath);
      return total + stats.size;
    }, 0);

    return { count: files.length, size };
  };

  const productsStats = getDirectoryStats(productImagesDir);
  const reviewsStats = getDirectoryStats(reviewImagesDir);
  const profilesStats = getDirectoryStats(profileImagesDir);

  return {
    totalFiles: productsStats.count + reviewsStats.count + profilesStats.count,
    totalSize: productsStats.size + reviewsStats.size + profilesStats.size,
    filesByType: {
      products: productsStats.count,
      reviews: reviewsStats.count,
      profiles: profilesStats.count,
    },
  };
};

/**
 * Clean up old files (maintenance operation)
 */
export const cleanupOldFiles = async (daysOld: number = 30): Promise<number> => {
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  const cleanDirectory = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      
      // Skip if not a file
      if (!fs.statSync(filePath).isFile()) return;
      
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
  };

  cleanDirectory(productImagesDir);
  cleanDirectory(reviewImagesDir);
  cleanDirectory(profileImagesDir);

  return deletedCount;
};