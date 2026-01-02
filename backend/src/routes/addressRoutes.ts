import { Router } from 'express';
import * as addressController from '../controllers/addressController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * All address routes require authentication
 */

// Get default address (must be before /:id to avoid route conflict)
router.get('/default', authenticate, addressController.getDefaultAddress);

// Get all user addresses
router.get('/', authenticate, addressController.getUserAddresses);

// Get single address
router.get('/:id', authenticate, addressController.getAddressById);

// Create new address
router.post('/', authenticate, addressController.createAddress);

// Update address
router.put('/:id', authenticate, addressController.updateAddress);

// Set address as default
router.put('/:id/default', authenticate, addressController.setDefaultAddress);

// Delete address
router.delete('/:id', authenticate, addressController.deleteAddress);

export default router;