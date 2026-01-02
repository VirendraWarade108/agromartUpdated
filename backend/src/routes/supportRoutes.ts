import { Router } from 'express';
import * as supportController from '../controllers/supportController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as supportValidators from '../validators/support';

const router = Router();

// Replace existing routes with validated versions:
router.post('/contact', validate(supportValidators.submitContactMessageSchema), supportController.submitContactMessage);
router.post('/newsletter', validate(supportValidators.subscribeToNewsletterSchema), supportController.subscribeToNewsletter);
router.post('/newsletter/subscribe', validate(supportValidators.subscribeToNewsletterSchema), supportController.subscribeToNewsletter);
router.post('/newsletter/unsubscribe', validate(supportValidators.unsubscribeFromNewsletterSchema), supportController.unsubscribeFromNewsletter);
router.get('/faqs', validate(supportValidators.getAllFAQsSchema), supportController.getAllFAQs);
router.get('/faqs/:id', validate(supportValidators.getFAQByIdSchema), supportController.getFAQById);
router.get('/admin/messages', authenticate, requireAdmin, validate(supportValidators.getAllContactMessagesSchema), supportController.getAllContactMessages);
router.put('/admin/messages/:id', authenticate, requireAdmin, validate(supportValidators.updateMessageStatusSchema), supportController.updateMessageStatus);
router.delete('/admin/messages/:id', authenticate, requireAdmin, validate(supportValidators.deleteContactMessageSchema), supportController.deleteContactMessage);
router.get('/admin/newsletter', authenticate, requireAdmin, validate(supportValidators.getAllSubscribersSchema), supportController.getAllSubscribers);
router.post('/admin/faqs', authenticate, requireAdmin, validate(supportValidators.createFAQSchema), supportController.createFAQ);
router.put('/admin/faqs/:id', authenticate, requireAdmin, validate(supportValidators.updateFAQSchema), supportController.updateFAQ);
router.delete('/admin/faqs/:id', authenticate, requireAdmin, validate(supportValidators.deleteFAQSchema), supportController.deleteFAQ);

export default router;