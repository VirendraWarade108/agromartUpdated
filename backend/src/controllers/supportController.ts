import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as supportService from '../services/supportService';

// ============================================
// CONTACT MESSAGE ENDPOINTS
// ============================================

/**
 * Submit contact message
 * POST /api/support/contact
 */
export const submitContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required',
      });
    }

    const contactMessage = await supportService.submitContactMessage({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.',
      data: contactMessage,
    });
  }
);

/**
 * Get all contact messages (Admin)
 * GET /api/admin/support/messages
 */
export const getAllContactMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;

    const result = await supportService.getAllContactMessages({
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
    });
  }
);

/**
 * Update message status (Admin)
 * PUT /api/admin/support/messages/:id
 */
export const updateMessageStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const message = await supportService.updateMessageStatus(id, status);

    res.json({
      success: true,
      message: 'Message status updated',
      data: message,
    });
  }
);

/**
 * Delete message (Admin)
 * DELETE /api/admin/support/messages/:id
 */
export const deleteContactMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await supportService.deleteContactMessage(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

// ============================================
// NEWSLETTER ENDPOINTS
// ============================================

/**
 * Subscribe to newsletter
 * POST /api/support/newsletter/subscribe
 */
export const subscribeToNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const subscription = await supportService.subscribeToNewsletter(email);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscription,
    });
  }
);

/**
 * Unsubscribe from newsletter
 * POST /api/support/newsletter/unsubscribe
 */
export const unsubscribeFromNewsletter = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const subscription = await supportService.unsubscribeFromNewsletter(email);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: subscription,
    });
  }
);

/**
 * Get all subscribers (Admin)
 * GET /api/admin/support/newsletter
 */
export const getAllSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { isActive, page, limit } = req.query;

    const result = await supportService.getAllSubscribers({
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.subscribers,
      pagination: result.pagination,
    });
  }
);

/**
 * Get newsletter stats (Admin)
 * GET /api/admin/support/newsletter/stats
 */
export const getNewsletterStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await supportService.getNewsletterStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);

// ============================================
// FAQ ENDPOINTS
// ============================================

/**
 * Get all FAQs
 * GET /api/support/faqs
 */
export const getAllFAQs = asyncHandler(
  async (req: Request, res: Response) => {
    const { category } = req.query;

    const faqs = await supportService.getAllFAQs(category as string);

    res.json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  }
);

/**
 * Get FAQ by ID
 * GET /api/support/faqs/:id
 */
export const getFAQById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const faq = await supportService.getFAQById(id);

    res.json({
      success: true,
      data: faq,
    });
  }
);

/**
 * Get FAQ categories
 * GET /api/support/faqs/categories
 */
export const getFAQCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await supportService.getFAQCategories();

    res.json({
      success: true,
      data: categories,
    });
  }
);

/**
 * Create FAQ (Admin)
 * POST /api/admin/support/faqs
 */
export const createFAQ = asyncHandler(
  async (req: Request, res: Response) => {
    const { question, answer, category, order, isActive } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and category are required',
      });
    }

    const faq = await supportService.createFAQ({
      question,
      answer,
      category,
      order,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  }
);

/**
 * Update FAQ (Admin)
 * PUT /api/admin/support/faqs/:id
 */
export const updateFAQ = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { question, answer, category, order, isActive } = req.body;

    const faq = await supportService.updateFAQ(id, {
      question,
      answer,
      category,
      order,
      isActive,
    });

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  }
);

/**
 * Delete FAQ (Admin)
 * DELETE /api/admin/support/faqs/:id
 */
export const deleteFAQ = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await supportService.deleteFAQ(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);

// ============================================
// SUPPORT TICKET ENDPOINTS
// ============================================

/**
 * Create support ticket (User)
 * POST /api/support/tickets
 */
export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { subject, description, priority, attachments } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    const ticket = await supportService.createTicket({
      userId,
      subject,
      description,
      priority,
      attachments,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  }
);

/**
 * Get user's tickets
 * GET /api/support/tickets
 */
export const getUserTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { status, priority, page, limit } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await supportService.getUserTickets(userId, {
      status: status as any,
      priority: priority as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    });
  }
);

/**
 * Get all tickets (Admin)
 * GET /api/admin/support/tickets
 */
export const getAllTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const { status, priority, assignedToId, page, limit } = req.query;

    const result = await supportService.getAllTickets({
      status: status as any,
      priority: priority as any,
      assignedToId: assignedToId as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.tickets,
      pagination: result.pagination,
    });
  }
);

/**
 * Get ticket by ID
 * GET /api/support/tickets/:id
 */
export const getTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin || false;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ticket = await supportService.getTicketById(id, userId, isAdmin);

    res.json({
      success: true,
      data: ticket,
    });
  }
);

/**
 * Update ticket
 * PUT /api/support/tickets/:id
 */
export const updateTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin || false;
    const { subject, description, status, priority, assignedToId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ticket = await supportService.updateTicket(id, userId, isAdmin, {
      subject,
      description,
      status,
      priority,
      assignedToId,
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  }
);

/**
 * Add comment to ticket
 * POST /api/support/tickets/:id/comments
 */
export const addComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.isAdmin || false;
    const { message, isInternal } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const comment = await supportService.addComment({
      ticketId: id,
      userId,
      message,
      isInternal,
      isAdmin,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  }
);

/**
 * Assign ticket (Admin)
 * PUT /api/admin/support/tickets/:id/assign
 */
export const assignTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const ticket = await supportService.assignTicket(id, assignedToId || null);

    res.json({
      success: true,
      message: assignedToId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully',
      data: ticket,
    });
  }
);

/**
 * Get ticket statistics (Admin)
 * GET /api/admin/support/tickets/stats
 */
export const getTicketStats = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await supportService.getTicketStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);

/**
 * Delete ticket (Admin)
 * DELETE /api/admin/support/tickets/:id
 */
export const deleteTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await supportService.deleteTicket(id);

    res.json({
      success: true,
      message: result.message,
    });
  }
);