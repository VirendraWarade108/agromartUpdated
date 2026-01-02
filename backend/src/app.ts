import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// =======================
// Import routes
// =======================
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import orderTrackingRoutes from './routes/orderTrackingRoutes';
import addressRoutes from './routes/addressRoutes';
import couponRoutes from './routes/couponRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminProductRoutes from './routes/adminProductRoutes';
import wishlistRoutes from './routes/Wishlistroutes';
import reviewRoutes from './routes/reviewroutes';
import path from 'path';
import uploadRoutes from './routes/uploadRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import supportRoutes from './routes/supportRoutes';
import userRoutes from './routes/userRoutes';           // ✅ ADDED
import blogRoutes from './routes/blogRoutes';           // ✅ ADDED
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes'; // ✅ ADDED
import adminCategoryRoutes from './routes/adminCategoryRoutes';
/**
 * Create Express application
 */
const app: Express = express();
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
/**
 * Connect to database
 */
connectDatabase();
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/upload', uploadRoutes);
// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AgroMart API Server',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint - API information
 */
app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'AgroMart API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      cart: '/api/cart',
      checkout: '/api/checkout',
      orders: '/api/orders',

      // ✅ NEW
      addresses: '/api/users/addresses',
      coupons: '/api/coupons',
      payment: '/api/payment',
      adminProducts: '/api/admin/products',
      wishlist: '/api/wishlist',
      wishlistAlt: '/api/users/wishlist', // ✅ ADDED
      upload: '/api/upload',
      adminUsers: '/api/admin/users',
      support: '/api/support',
      tracking: '/api/orders/:orderId/tracking',
      reviews: '/api/reviews',
      users: '/api/users',              // ✅ ADDED
      blog: '/api/blog',                // ✅ ADDED
      adminAnalytics: '/api/admin/analytics', // ✅ ADDED
    },
  });
});

/**
 * =======================
 * API Routes
 * =======================
 */

// Auth
app.use('/api/auth', authRoutes);

// Storefront
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Reviews (must be mounted before /api for /products/:productId/reviews to work)
app.use('/api', reviewRoutes);

// Cart / Checkout / Orders
app.use('/api', orderRoutes);

// Order Tracking (must be mounted before generic /orders routes to avoid conflicts)
app.use('/api/orders', orderTrackingRoutes);

// User
app.use('/api/users/addresses', addressRoutes);

// Coupons
app.use('/api/coupons', couponRoutes);

// Payment
app.use('/api/payment', paymentRoutes); // ✅ UNCOMMENTED

// User Profile & Settings
app.use('/api/users', userRoutes); // ✅ ADDED

// Blog
app.use('/api/blog', blogRoutes); // ✅ ADDED

// Admin
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes); 
app.use('/api/admin/analytics', adminAnalyticsRoutes); // ✅ ADDED

// ✅ WISHLIST - Mount at BOTH paths for compatibility
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users/wishlist', wishlistRoutes); // ✅ ADDED for frontend compatibility

/**
 * 404 handler
 */
app.use(notFoundHandler);

/**
 * Global error handler
 */
app.use(errorHandler);

export default app;