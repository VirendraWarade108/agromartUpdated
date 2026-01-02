import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoiceService';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Invoice Controller
 * Handles HTTP requests for invoice operations
 */

/**
 * Generate and download invoice for an order
 * 
 * @route GET /api/orders/:orderId/invoice
 * @access Private (User must own the order)
 */
export const downloadInvoice = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { orderId } = req.params;
    const userId = req.userId;

    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    try {
      // Generate invoice
      const { filename, filepath } = await invoiceService.generateInvoice(
        orderId,
        userId
      );

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file
      res.sendFile(filepath);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate invoice', 500);
    }
  }
);

/**
 * Generate invoice (admin only)
 * 
 * @route POST /api/admin/orders/:orderId/invoice
 * @access Private (Admin only)
 */
export const generateInvoice = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }

    try {
      // Generate invoice (no user check for admin)
      const { filename, filepath } = await invoiceService.generateInvoice(orderId);

      res.status(200).json({
        success: true,
        message: 'Invoice generated successfully',
        data: {
          filename,
          downloadUrl: `/api/orders/${orderId}/invoice`,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to generate invoice', 500);
    }
  }
);

/**
 * Get invoice by filename (admin only)
 * 
 * @route GET /api/admin/invoices/:filename
 * @access Private (Admin only)
 */
export const getInvoiceByFilename = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { filename } = req.params;

    if (!filename) {
      throw new AppError('Filename is required', 400);
    }

    try {
      const filepath = invoiceService.getInvoiceFilePath(filename);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file
      res.sendFile(filepath);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve invoice', 500);
    }
  }
);

/**
 * Delete invoice (admin only)
 * 
 * @route DELETE /api/admin/invoices/:filename
 * @access Private (Admin only)
 */
export const deleteInvoice = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { filename } = req.params;

    if (!filename) {
      throw new AppError('Filename is required', 400);
    }

    try {
      invoiceService.deleteInvoice(filename);

      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete invoice', 500);
    }
  }
);