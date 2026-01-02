import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * Invoice Routes
 * Handles invoice generation and download
 */

// ============================================
// USER ROUTES (Protected)
// ============================================

/**
 * @route   GET /api/orders/:orderId/invoice
 * @desc    Download invoice for a specific order
 * @access  Private (User must own the order)
 */
router.get(
  '/orders/:orderId/invoice',
  authenticate,
  invoiceController.downloadInvoice
);

// ============================================
// ADMIN ROUTES (Protected + Admin Only)
// ============================================

/**
 * @route   POST /api/admin/orders/:orderId/invoice
 * @desc    Generate invoice for any order
 * @access  Private (Admin only)
 */
router.post(
  '/admin/orders/:orderId/invoice',
  authenticate,
  requireAdmin,
  invoiceController.generateInvoice
);

/**
 * @route   GET /api/admin/invoices/:filename
 * @desc    Get invoice by filename
 * @access  Private (Admin only)
 */
router.get(
  '/admin/invoices/:filename',
  authenticate,
  requireAdmin,
  invoiceController.getInvoiceByFilename
);

/**
 * @route   DELETE /api/admin/invoices/:filename
 * @desc    Delete invoice file
 * @access  Private (Admin only)
 */
router.delete(
  '/admin/invoices/:filename',
  authenticate,
  requireAdmin,
  invoiceController.deleteInvoice
);

export default router;