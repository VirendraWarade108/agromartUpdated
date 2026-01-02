import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as supportValidators from '../validators/support';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Contact messages
router.post(
  '/contact',
  validate(supportValidators.submitContactMessageSchema),
  supportController.submitContactMessage
);

// Newsletter
router.post(
  '/newsletter',
  validate(supportValidators.subscribeToNewsletterSchema),
  supportController.subscribeToNewsletter
);

router.post(
  '/newsletter/subscribe',
  validate(supportValidators.subscribeToNewsletterSchema),
  supportController.subscribeToNewsletter
);

router.post(
  '/newsletter/unsubscribe',
  validate(supportValidators.unsubscribeFromNewsletterSchema),
  supportController.unsubscribeFromNewsletter
);

// FAQs
router.get(
  '/faqs',
  validate(supportValidators.getAllFAQsSchema),
  supportController.getAllFAQs
);

router.get(
  '/faqs/categories',
  supportController.getFAQCategories
);

router.get(
  '/faqs/:id',
  validate(supportValidators.getFAQByIdSchema),
  supportController.getFAQById
);

// ============================================
// USER ROUTES (AUTHENTICATED)
// ============================================

// Support tickets - User
router.post(
  '/tickets',
  authenticate,
  supportController.createTicket
);

router.get(
  '/tickets',
  authenticate,
  supportController.getUserTickets
);

router.get(
  '/tickets/:id',
  authenticate,
  supportController.getTicketById
);

router.put(
  '/tickets/:id',
  authenticate,
  supportController.updateTicket
);

router.post(
  '/tickets/:id/comments',
  authenticate,
  supportController.addComment
);

// ============================================
// ADMIN ROUTES
// ============================================

// Contact messages - Admin
router.get(
  '/admin/messages',
  authenticate,
  requireAdmin,
  validate(supportValidators.getAllContactMessagesSchema),
  supportController.getAllContactMessages
);

router.put(
  '/admin/messages/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.updateMessageStatusSchema),
  supportController.updateMessageStatus
);

router.delete(
  '/admin/messages/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.deleteContactMessageSchema),
  supportController.deleteContactMessage
);

// Newsletter - Admin
router.get(
  '/admin/newsletter',
  authenticate,
  requireAdmin,
  validate(supportValidators.getAllSubscribersSchema),
  supportController.getAllSubscribers
);

router.get(
  '/admin/newsletter/stats',
  authenticate,
  requireAdmin,
  supportController.getNewsletterStats
);

// FAQs - Admin
router.post(
  '/admin/faqs',
  authenticate,
  requireAdmin,
  validate(supportValidators.createFAQSchema),
  supportController.createFAQ
);

router.put(
  '/admin/faqs/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.updateFAQSchema),
  supportController.updateFAQ
);

router.delete(
  '/admin/faqs/:id',
  authenticate,
  requireAdmin,
  validate(supportValidators.deleteFAQSchema),
  supportController.deleteFAQ
);

// Support tickets - Admin
router.get(
  '/admin/tickets',
  authenticate,
  requireAdmin,
  supportController.getAllTickets
);

router.get(
  '/admin/tickets/stats',
  authenticate,
  requireAdmin,
  supportController.getTicketStats
);

router.put(
  '/admin/tickets/:id/assign',
  authenticate,
  requireAdmin,
  supportController.assignTicket
);

router.delete(
  '/admin/tickets/:id',
  authenticate,
  requireAdmin,
  supportController.deleteTicket
);

export default router;