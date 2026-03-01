import { Router } from 'express';
import { body } from 'express-validator';
import {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public - validate coupon
router.post(
  '/validate',
  validate([
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('orderAmount')
      .isFloat({ min: 0 })
      .withMessage('Valid order amount is required'),
  ]),
  validateCoupon
);

// Admin routes
router.use(authenticate, requireAdmin);

router.get('/', listCoupons);

router.post(
  '/',
  validate([
    body('code').trim().notEmpty().withMessage('Code is required'),
    body('discountType')
      .isIn(['PERCENT', 'FLAT'])
      .withMessage('Discount type must be PERCENT or FLAT'),
    body('discountValue')
      .isFloat({ min: 0 })
      .withMessage('Discount value must be positive'),
  ]),
  createCoupon
);

router.patch('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
