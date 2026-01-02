import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as authValidators from '../validators/auth';

const router = Router();

// Replace existing routes with validated versions:
router.post('/register', validate(authValidators.registerSchema), authController.register);
router.post('/login', validate(authValidators.loginSchema), authController.login);
router.post('/refresh', validate(authValidators.refreshSchema), authController.refresh);
router.put('/profile', authenticate, validate(authValidators.updateProfileSchema), authController.updateProfile);

// Alias for frontend compatibility
router.get('/me', authenticate, authController.getProfile);

export default router;