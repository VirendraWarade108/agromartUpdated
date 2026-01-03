import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as supportValidators from '../validators/support';
import {
  contactLimiter,
  newsletterLimiter,
  ticketLimiter,
} from '../middleware/rateLimiter';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Contact messages
 * POST /api/support/contact
 * Rate Limited: 3 submissions per hour per IP
 * Validation: Required
 */
router.post(
  '/contact',
  contactLimiter,
  validate(supportValidators.submitContactMessageSchema),
  supportController.submitContactMessage
);

/**
 * Newsletter subscription
 * POST /api/support/newsletter
 * Rate Limited: 2 subscriptions per hour per IP
 * Validation: Required
 */
router.post(
  '/newsletter',
  newsletterLimiter,
  validate(supportValidators.subscribeToNewsletterSchema),
  supportController.subscribeToNewsletter
);

/**
 * Newsletter subscription (alternative endpoint)
 * POST /api/support/newsletter/subscribe
 * Rate Limited: 2 subscriptions per hour per IP
 * Validation: Required
 */
router.post(
  '/newsletter/subscribe',
  newsletterLimiter,
  validate(supportValidators.subscribeToNewsletterSchema),
  supportController.subscribeToNewsletter
);

/**
 * Newsletter unsubscription
 * POST /api/support/newsletter/unsubscribe
 * Rate Limited: No (unsubscribe should always be allowed)
 * Validation: Required
 */
router.post(
  '/newsletter/unsubscribe',
  validate(supportValidators.unsubscribeFromNewsletterSchema),
  supportController.unsubscribeFromNewsletter
);

/**
 * Get all FAQs
 * GET /api/support/faqs
 * Rate Limited: No (read-only, public information)
 * Validation: Query params
 */
router.get(
  '/faqs',
  validate(supportValidators.getAllFAQsSchema),
  supportController.getAllFAQs
);

/**
 * Get FAQ categories
 * GET /api/support/faqs/categories
 * Rate Limited: No (read-only, public information)
 * Validation: None
 */
router.get(
  '/faqs/categories',
  supportController.getFAQCategories
);

/**
 * Get FAQ by ID
 * GET /api/support/faqs/:id
 * Rate Limited: No (read-only, public information)
 * Validation: Required (params)
 */
router.get(
  '/faqs/:id',
  validate(supportValidators.getFAQByIdSchema),
  supportController.getFAQById
);

// ============================================
// USER ROUTES (AUTHENTICATED)
// ============================================

/**
 * Create support ticket
 * POST /api/support/tickets
 * Rate Limited: 5 tickets per day per user
 * Validation: Will be added in next validator update
 */
router.post(
  '/tickets',
  authenticate,
  ticketLimiter,
  supportController.createTicket
);

/**
 * Get user's tickets
 * GET /api/support/tickets
 * Rate Limited: No (read-only, user's own data)
 * Validation: None
 */
router.get(
  '/tickets',
  authenticate,
  supportController.getUserTickets
);

/**
 * Get ticket by ID
 * GET /api/support/tickets/:id
 * Rate Limited: No (read-only, user's own data)
 * Validation: None
 */
router.get(
  '/tickets/:id',
  authenticate,
  supportController.getTicketById
);

/**
 * Update ticket
 * PUT /api/support/tickets/:id
 * Rate Limited: No (user updating their own ticket)
 * Validation: Will be added in next validator update
 */
router.put(
  '/tickets/:id',
  authenticate,
  supportController.updateTicket
);

/**
 * Add comment to ticket
 * POST /api/support/tickets/:id/comments
 * Rate Limited: No (authenticated users only)
 * Validation: Will be added in next validator update
 */
router.post(
  '/tickets/:id/comments',
  authenticate,
  supportController.addComment
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Get all contact messages
 * GET /api/support/admin/messages
 * Rate Limited: No (admin only)
 * Validation: Query params
 */
router.get(
  '/admin/messages',
  authenticate,
  requireAdmin,
  validate(supportValidators.getAllContactMessagesSchema),
  supportController.getAllContactMessages
);

/**
 * Update message status
 * PUT /api/support/admin/messages/:id
 * Rate Limited: No (admin only)
 * Validation: Required (params + body)
 */
router.put(
  '/admin/messages/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.updateMessageStatusSchema),
  supportController.updateMessageStatus
);

/**
 * Delete contact message
 * DELETE /api/support/admin/messages/:id
 * Rate Limited: No (admin only)
 * Validation: Required (params)
 */
router.delete(
  '/admin/messages/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.deleteContactMessageSchema),
  supportController.deleteContactMessage
);

/**
 * Get all newsletter subscribers
 * GET /api/support/admin/newsletter
 * Rate Limited: No (admin only)
 * Validation: Query params
 */
router.get(
  '/admin/newsletter',
  authenticate,
  requireAdmin,
  validate(supportValidators.getAllSubscribersSchema),
  supportController.getAllSubscribers
);

/**
 * Get newsletter statistics
 * GET /api/support/admin/newsletter/stats
 * Rate Limited: No (admin only)
 * Validation: None
 */
router.get(
  '/admin/newsletter/stats',
  authenticate,
  requireAdmin,
  supportController.getNewsletterStats
);

/**
 * Create FAQ
 * POST /api/support/admin/faqs
 * Rate Limited: No (admin only)
 * Validation: Required
 */
router.post(
  '/admin/faqs',
  authenticate,
  requireAdmin,
  validate(supportValidators.createFAQSchema),
  supportController.createFAQ
);

/**
 * Update FAQ
 * PUT /api/support/admin/faqs/:id
 * Rate Limited: No (admin only)
 * Validation: Required (params + body)
 */
router.put(
  '/admin/faqs/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.updateFAQSchema),
  supportController.updateFAQ
);

/**
 * Delete FAQ
 * DELETE /api/support/admin/faqs/:id
 * Rate Limited: No (admin only)
 * Validation: Required (params)
 */
router.delete(
  '/admin/faqs/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.deleteFAQSchema),
  supportController.deleteFAQ
);

/**
 * Get all support tickets (admin)
 * GET /api/support/admin/tickets
 * Rate Limited: No (admin only)
 * Validation: None
 */
router.get(
  '/admin/tickets',
  authenticate,
  requireAdmin,
  supportController.getAllTickets
);

/**
 * Get ticket statistics
 * GET /api/support/admin/tickets/stats
 * Rate Limited: No (admin only)
 * Validation: None
 */
router.get(
  '/admin/tickets/stats',
  authenticate,
  requireAdmin,
  supportController.getTicketStats
);

/**
 * Assign ticket to admin
 * PUT /api/support/admin/tickets/:id/assign
 * Rate Limited: No (admin only)
 * Validation: Will be added in next validator update
 */
router.put(
  '/admin/tickets/:id/assign',
  authenticate,
  requireAdmin,
  supportController.assignTicket
);

/**
 * Delete ticket
 * DELETE /api/support/admin/tickets/:id
 * Rate Limited: No (admin only)
 * Validation: Will be added in next validator update
 */
router.delete(
  '/admin/tickets/:id',
  authenticate,
  requireAdmin,
  supportController.deleteTicket
);

/**
 * ============================================
 * ROUTE SUMMARY WITH PROTECTION
 * ============================================
 * PUBLIC (Rate Limited):
 *   POST   /support/contact                   - 3 req/hour per IP [VALIDATED]
 *   POST   /support/newsletter                - 2 req/hour per IP [VALIDATED]
 *   POST   /support/newsletter/subscribe      - 2 req/hour per IP [VALIDATED]
 * 
 * PUBLIC (No Rate Limits):
 *   POST   /support/newsletter/unsubscribe    - Always allowed [VALIDATED]
 *   GET    /support/faqs                      - Read-only [VALIDATED]
 *   GET    /support/faqs/categories           - Read-only
 *   GET    /support/faqs/:id                  - Read-only [VALIDATED]
 * 
 * AUTHENTICATED (Rate Limited):
 *   POST   /support/tickets                   - 5 req/day per user
 * 
 * AUTHENTICATED (No Rate Limits):
 *   GET    /support/tickets                   - User's own data
 *   GET    /support/tickets/:id               - User's own data
 *   PUT    /support/tickets/:id               - User's own data
 *   POST   /support/tickets/:id/comments      - Authenticated only
 * 
 * ADMIN (No Rate Limits):
 *   All /support/admin/* routes require authentication + admin role
 * ============================================
 */

export default router;