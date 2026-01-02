import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const productImagesDir = path.join(uploadDir, 'products');
const reviewImagesDir = path.join(uploadDir, 'reviews');
const profileImagesDir = path.join(uploadDir, 'profiles');

[uploadDir, productImagesDir, reviewImagesDir, profileImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generate unique filename
 */
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${randomString}${ext}`;
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    
    // Determine destination based on upload type
    if (req.path.includes('/products')) {
      dest = productImagesDir;
    } else if (req.path.includes('/reviews')) {
      dest = reviewImagesDir;
    } else if (req.path.includes('/profile')) {
      dest = profileImagesDir;
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

/**
 * File filter - only images
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpg, jpeg, png, gif, webp)', 400));
  }
};

/**
 * Multer upload middleware
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Get file URL
 */
export const getFileUrl = (filename: string, type: 'products' | 'reviews' | 'profiles'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

/**
 * Delete file from disk
 */
export const deleteFile = async (filename: string, type: 'products' | 'reviews' | 'profiles'): Promise<void> => {
  const filePath = path.join(uploadDir, type, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * Upload single image
 */
export const uploadSingleImage = async (
  file: Express.Multer.File | undefined,
  type: 'products' | 'reviews' | 'profiles'
): Promise<{ filename: string; url: string; size: number }> => {
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  return {
    filename: file.filename,
    url: getFileUrl(file.filename, type),
    size: file.size,
  };
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  files: Express.Multer.File[] | undefined,
  type: 'products' | 'reviews' | 'profiles'
): Promise<Array<{ filename: string; url: string; size: number }>> => {
  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  return files.map((file) => ({
    filename: file.filename,
    url: getFileUrl(file.filename, type),
    size: file.size,
  }));
};

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
 * Clean up old files (optional - for maintenance)
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