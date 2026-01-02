import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

/**
 * Generate invoice data for an order
 */
export const generateInvoice = async (orderId: string, userId?: string) => {
  // Get order with all details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Verify user access (if userId provided)
  if (userId && order.userId !== userId) {
    throw new AppError('Unauthorized to access this invoice', 403);
  }

  // Calculate subtotal
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Parse coupon data if exists
  let discount = 0;
  let couponCode = null;
  if (order.coupon && typeof order.coupon === 'object') {
    const couponData = order.coupon as any;
    couponCode = couponData.code || null;
    discount = couponData.discount || 0;
  }

  // ✅ FIXED: Implement shipping calculation
  // Free shipping above ₹5000, otherwise ₹200
  const shippingCharges = subtotal >= 5000 ? 0 : 200;
  
  // ✅ FIXED: Implement tax calculation
  // 18% GST on subtotal (after discount)
  const taxableAmount = subtotal - discount;
  const tax = Math.round(taxableAmount * 0.18 * 100) / 100; // 18% GST
  
  const total = order.total;

  // Generate order number from ID (simplified version)
  const orderNumber = `ORD-${order.id.substring(0, 8).toUpperCase()}`;

  // Build invoice data
  const invoice = {
    invoiceNumber: `INV-${orderNumber}`,
    orderNumber: orderNumber,
    orderId: order.id,
    invoiceDate: new Date().toISOString(),
    orderDate: order.createdAt.toISOString(),
    
    // Customer details
    customer: {
      name: order.user.fullName,
      email: order.user.email,
      phone: order.user.phone || 'N/A',
    },
    
    // Note: Addresses are not stored in Order model in current schema
    // They would need to be added to Order model or fetched from user's saved addresses
    billingAddress: null,
    shippingAddress: null,
    
    // Order items
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      category: item.product.category?.name || 'Uncategorized',
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    })),
    
    // Payment details (payment info not in current Order model)
    paymentMethod: 'N/A', // Would need to be added to Order model
    paymentStatus: 'Completed', // Assumption based on order being created
    
    // Price breakdown
    pricing: {
      subtotal,
      discount,
      couponCode,
      shippingCharges,
      tax,
      total,
    },
    
    // Additional info
    status: order.status,
    notes: null, // Notes field not in current Order model
  };

  return invoice;
};

/**
 * Get invoice as JSON
 */
export const getInvoiceJSON = async (orderId: string, userId?: string) => {
  return await generateInvoice(orderId, userId);
};

/**
 * Generate and stream PDF invoice
 * ✅ FIXED: Proper PDF generation implementation
 */
export const getInvoicePDF = async (
  orderId: string, 
  userId: string | undefined, 
  res: Response
) => {
  const invoice = await generateInvoice(orderId, userId);
  
  // Create PDF document
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50,
  });

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
  );

  // Pipe PDF to response
  doc.pipe(res);

  // --- HEADER ---
  doc
    .fontSize(24)
    .fillColor('#10b981')
    .text('AGROMART', 50, 50)
    .fontSize(10)
    .fillColor('#6b7280')
    .text('Agricultural Supplies & Equipment', 50, 80)
    .text('support@agromart.com | +91-1234567890', 50, 95);

  // Invoice title and number
  doc
    .fontSize(20)
    .fillColor('#111827')
    .text('INVOICE', 400, 50, { align: 'right' })
    .fontSize(10)
    .fillColor('#6b7280')
    .text(invoice.invoiceNumber, 400, 75, { align: 'right' })
    .text(
      `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 
      400, 
      90, 
      { align: 'right' }
    );

  // --- CUSTOMER DETAILS ---
  doc
    .fontSize(12)
    .fillColor('#111827')
    .text('Bill To:', 50, 140)
    .fontSize(10)
    .fillColor('#374151')
    .text(invoice.customer.name, 50, 160)
    .text(invoice.customer.email, 50, 175)
    .text(invoice.customer.phone, 50, 190);

  // Order details
  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text(`Order: ${invoice.orderNumber}`, 400, 140, { align: 'right' })
    .text(`Status: ${invoice.status.toUpperCase()}`, 400, 155, { align: 'right' });

  // --- LINE ITEMS TABLE ---
  let yPosition = 240;

  // Table header
  doc
    .fontSize(10)
    .fillColor('#ffffff')
    .rect(50, yPosition, 495, 25)
    .fill('#10b981')
    .fillColor('#ffffff')
    .text('Item', 60, yPosition + 8)
    .text('Qty', 320, yPosition + 8)
    .text('Price', 380, yPosition + 8)
    .text('Total', 470, yPosition + 8, { align: 'right' });

  yPosition += 25;

  // Table rows
  doc.fillColor('#374151');
  invoice.items.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
    
    doc
      .rect(50, yPosition, 495, 30)
      .fill(bgColor)
      .fillColor('#374151')
      .fontSize(9)
      .text(item.name, 60, yPosition + 10, { width: 250 })
      .text(item.quantity.toString(), 320, yPosition + 10)
      .text(`₹${item.unitPrice.toFixed(2)}`, 380, yPosition + 10)
      .text(`₹${item.total.toFixed(2)}`, 470, yPosition + 10, { align: 'right' });
    
    yPosition += 30;
  });

  // --- TOTALS SECTION ---
  yPosition += 20;

  const totalsX = 350;
  const valuesX = 480;

  doc
    .fontSize(10)
    .fillColor('#6b7280')
    .text('Subtotal:', totalsX, yPosition)
    .text(`₹${invoice.pricing.subtotal.toFixed(2)}`, valuesX, yPosition, { align: 'right' });

  yPosition += 20;

  if (invoice.pricing.discount > 0) {
    doc
      .text(`Discount${invoice.pricing.couponCode ? ` (${invoice.pricing.couponCode})` : ''}:`, totalsX, yPosition)
      .text(`-₹${invoice.pricing.discount.toFixed(2)}`, valuesX, yPosition, { align: 'right' });
    yPosition += 20;
  }

  doc
    .text('Tax (18% GST):', totalsX, yPosition)
    .text(`₹${invoice.pricing.tax.toFixed(2)}`, valuesX, yPosition, { align: 'right' });

  yPosition += 20;

  doc
    .text('Shipping:', totalsX, yPosition)
    .text(
      invoice.pricing.shippingCharges === 0 ? 'FREE' : `₹${invoice.pricing.shippingCharges.toFixed(2)}`, 
      valuesX, 
      yPosition, 
      { align: 'right' }
    );

  yPosition += 20;

  // Total line
  doc
    .strokeColor('#10b981')
    .lineWidth(1)
    .moveTo(350, yPosition)
    .lineTo(545, yPosition)
    .stroke();

  yPosition += 10;

  doc
    .fontSize(12)
    .fillColor('#111827')
    .text('Total:', totalsX, yPosition)
    .text(`₹${invoice.pricing.total.toFixed(2)}`, valuesX, yPosition, { align: 'right' });

  // --- FOOTER ---
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text(
      'Thank you for your business! For support, contact support@agromart.com',
      50,
      750,
      { align: 'center', width: 495 }
    );

  // Finalize PDF
  doc.end();
};