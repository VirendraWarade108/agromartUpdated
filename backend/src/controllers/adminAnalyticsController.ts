import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as adminAnalyticsService from '../services/adminAnalyticsService';

/**
 * Get dashboard statistics
 * GET /api/admin/analytics/dashboard
 */
export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await adminAnalyticsService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Get sales report
 * GET /api/admin/analytics/sales
 */
export const getSalesReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { startDate, endDate, groupBy } = req.query;

    const report = await adminAnalyticsService.getSalesReport({
      startDate: startDate as string,
      endDate: endDate as string,
      groupBy: groupBy as 'day' | 'week' | 'month',
    });

    res.json({
      success: true,
      data: report,
    });
  }
);

/**
 * Get product performance
 * GET /api/admin/analytics/products
 */
export const getProductPerformance = asyncHandler(
  async (req: Request, res: Response) => {
    const { limit } = req.query;

    const performance = await adminAnalyticsService.getProductPerformance(
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: performance,
    });
  }
);

/**
 * Get user statistics
 * GET /api/admin/analytics/users
 */
export const getUserStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await adminAnalyticsService.getUserStatistics();

    res.json({
      success: true,
      data: stats,
    });
  }
);