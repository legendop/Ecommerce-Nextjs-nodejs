import { Router } from 'express';
import { body } from 'express-validator';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { paymentLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Create Razorpay order
router.post(
  '/razorpay/create',
  authenticate,
  paymentLimiter,
  validate([
    body('orderId').notEmpty().withMessage('Order ID is required'),
  ]),
  createRazorpayOrder
);

// Verify Razorpay payment
router.post(
  '/razorpay/verify',
  paymentLimiter,
  validate([
    body('razorpay_order_id').notEmpty(),
    body('razorpay_payment_id').notEmpty(),
    body('razorpay_signature').notEmpty(),
  ]),
  verifyRazorpayPayment
);

// Razorpay webhook (no auth required)
router.post('/razorpay/webhook', razorpayWebhook);

export default router;
