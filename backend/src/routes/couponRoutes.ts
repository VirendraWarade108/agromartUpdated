import { Router } from 'express';
import * as couponController from '../controllers/couponController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as couponValidators from '../validators/coupon';

const router = Router();

// Replace existing routes with validated versions:
router.get('/admin/list', authenticate, requireAdmin, validate(couponValidators.getAllCouponsSchema), couponController.getAllCoupons);
router.get('/admin/:id', authenticate, requireAdmin, validate(couponValidators.getCouponByIdSchema), couponController.getCouponById);
router.post('/admin', authenticate, requireAdmin, validate(couponValidators.createCouponSchema), couponController.createCoupon);
router.put('/admin/:id', authenticate, requireAdmin, validate(couponValidators.updateCouponSchema), couponController.updateCoupon);
router.put('/admin/:id/toggle', authenticate, requireAdmin, validate(couponValidators.toggleCouponStatusSchema), couponController.toggleCouponStatus);
router.get('/admin/:id/stats', authenticate, requireAdmin, validate(couponValidators.getCouponStatsSchema), couponController.getCouponStats);
router.delete('/admin/:id', authenticate, requireAdmin, validate(couponValidators.deleteCouponSchema), couponController.deleteCoupon);
router.post('/validate', authenticate, validate(couponValidators.validateCouponSchema), couponController.validateCoupon);
router.get('/:code', validate(couponValidators.getCouponByCodeSchema), couponController.getCouponByCode);

export default router;
