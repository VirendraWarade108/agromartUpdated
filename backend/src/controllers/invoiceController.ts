import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as invoiceService from '../services/invoiceService';

/**
 * Get order invoice as JSON
 * GET /api/orders/:id/invoice
 */
export const getOrderInvoice = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const invoice = await invoiceService.getInvoiceJSON(id, userId);

    res.json({
      success: true,
      data: invoice,
    });
  }
);

/**
 * Get order invoice as PDF
 * GET /api/orders/:id/invoice/pdf
 * ✅ FIXED: Now properly generates and streams PDF
 */
export const getOrderInvoicePDF = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    // This function will set headers and stream PDF directly to response
    await invoiceService.getInvoicePDF(id, userId, res);
    
    // Response is already sent by the service
    // No need to call res.json() here
  }
);