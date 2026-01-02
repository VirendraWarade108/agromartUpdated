import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Invoice Service
 * Handles invoice generation and storage
 */

const INVOICES_DIR = path.join(__dirname, '../../uploads/invoices');

// Ensure invoices directory exists
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Generate invoice number
 * Format: INV-YYYY-XXXX (e.g., INV-2026-0001)
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Count invoices created this year
  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}-${sequence}`;
};

/**
 * Format currency
 */
const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Generate PDF invoice for an order
 */
export const generateInvoice = async (
  orderId: string,
  userId?: string
): Promise<{ filename: string; filepath: string }> => {
  // Fetch order with all relations
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Authorization check
  if (userId && order.userId !== userId) {
    throw new AppError('You are not authorized to access this invoice', 403);
  }

  // Calculate invoice details
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const couponDiscount =
    order.coupon && typeof order.coupon === 'object' && 'discount' in order.coupon
      ? (order.coupon as any).discount
      : 0;

  const tax = Math.round(((subtotal - couponDiscount) * 0.18) * 100) / 100;
  const shipping = subtotal >= 5000 ? 0 : 200;
  const total = order.total;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create PDF
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const filename = `${invoiceNumber}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Header
  doc
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('INVOICE', 50, 50, { align: 'left' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Invoice Number: ${invoiceNumber}`, 50, 90)
    .text(`Order ID: ${order.id}`, 50, 105)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 120)
    .text(`Status: ${order.status.toUpperCase()}`, 50, 135);

  // Company Info (Seller)
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('FROM:', 50, 170);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('AgroMart', 50, 190)
    .text('Agricultural Market Complex', 50, 205)
    .text('India', 50, 220)
    .text('Email: support@agromart.com', 50, 235)
    .text('Phone: +91-1234567890', 50, 250);

  // Customer Info (Buyer)
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('TO:', 350, 170);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(order.user.fullName, 350, 190)
    .text(order.user.email, 350, 205)
    .text(order.user.phone || 'N/A', 350, 220);

  // Line separator
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, 280)
    .lineTo(550, 280)
    .stroke();

  // Table Header
  const tableTop = 300;
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('ITEM', 50, tableTop)
    .text('QUANTITY', 300, tableTop, { width: 80, align: 'center' })
    .text('PRICE', 380, tableTop, { width: 80, align: 'right' })
    .text('TOTAL', 460, tableTop, { width: 90, align: 'right' });

  // Table line
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, tableTop + 15)
    .lineTo(550, tableTop + 15)
    .stroke();

  // Table Items
  let yPosition = tableTop + 30;
  doc.font('Helvetica').fontSize(9);

  for (const item of order.items) {
    const itemTotal = item.price * item.quantity;

    doc
      .text(item.product.name, 50, yPosition, { width: 230 })
      .text(String(item.quantity), 300, yPosition, { width: 80, align: 'center' })
      .text(formatCurrency(item.price), 380, yPosition, { width: 80, align: 'right' })
      .text(formatCurrency(itemTotal), 460, yPosition, { width: 90, align: 'right' });

    yPosition += 25;
  }

  // Summary section
  yPosition += 20;
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(350, yPosition)
    .lineTo(550, yPosition)
    .stroke();

  yPosition += 20;

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('Subtotal:', 350, yPosition)
    .text(formatCurrency(subtotal), 460, yPosition, { width: 90, align: 'right' });

  yPosition += 20;

  if (couponDiscount > 0) {
    doc
      .text('Discount:', 350, yPosition)
      .text(`-${formatCurrency(couponDiscount)}`, 460, yPosition, { width: 90, align: 'right' });
    yPosition += 20;
  }

  doc
    .text('Tax (GST 18%):', 350, yPosition)
    .text(formatCurrency(tax), 460, yPosition, { width: 90, align: 'right' });

  yPosition += 20;

  doc
    .text('Shipping:', 350, yPosition)
    .text(shipping === 0 ? 'FREE' : formatCurrency(shipping), 460, yPosition, { width: 90, align: 'right' });

  yPosition += 20;

  doc
    .strokeColor('#000000')
    .lineWidth(2)
    .moveTo(350, yPosition)
    .lineTo(550, yPosition)
    .stroke();

  yPosition += 20;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('TOTAL:', 350, yPosition)
    .text(formatCurrency(total), 460, yPosition, { width: 90, align: 'right' });

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .text(
      'Thank you for your business!',
      50,
      700,
      { align: 'center', width: 500 }
    );

  doc
    .fontSize(7)
    .text(
      'This is a computer-generated invoice and does not require a signature.',
      50,
      720,
      { align: 'center', width: 500 }
    );

  // Finalize PDF
  doc.end();

  // Wait for stream to finish
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });

  return { filename, filepath };
};

/**
 * Get invoice file path
 */
export const getInvoiceFilePath = (filename: string): string => {
  const filepath = path.join(INVOICES_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new AppError('Invoice file not found', 404);
  }
  
  return filepath;
};

/**
 * Delete invoice file
 */
export const deleteInvoice = (filename: string): void => {
  const filepath = path.join(INVOICES_DIR, filename);
  
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
};