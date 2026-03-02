import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  paymentWebhook,
  adminListPayments,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// USER ROUTES
// ==========================================
router.post(
  '/create',
  authenticate,
  [
    body('orderId').notEmpty().withMessage('Order ID required'),
    body('provider').notEmpty().withMessage('Payment provider required'),
  ],
  validate,
  createPayment
);

router.post('/verify', authenticate, verifyPayment);
router.get('/:id/status', authenticate, getPaymentStatus);

// ==========================================
// WEBHOOK ROUTES
// ==========================================
router.post('/webhook/:provider', paymentWebhook);

// ==========================================
// ADMIN ROUTES// ==========================================
router.get('/admin/all', authenticate, requireManager, adminListPayments);

export default router;
