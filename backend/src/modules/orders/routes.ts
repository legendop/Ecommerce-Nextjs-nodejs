import { Router } from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getOrder,
  adminListOrders,
  adminGetOrder,
  updateOrderStatus,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// User routes
router.use(authenticate);

router.post(
  '/',
  validate([
    body('addressId').notEmpty().withMessage('Address is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('paymentMethod')
      .isIn(['COD', 'RAZORPAY', 'UPI', 'CARD'])
      .withMessage('Invalid payment method'),
  ]),
  createOrder
);

router.get('/', getMyOrders);
router.get('/:orderNumber', getOrder);

// Admin routes
router.get('/admin/all', requireManager, adminListOrders);
router.get('/admin/:id', requireManager, adminGetOrder);

router.patch(
  '/admin/:id/status',
  requireManager,
  validate([
    body('status')
      .isIn([
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURNED',
      ])
      .withMessage('Invalid status'),
  ]),
  updateOrderStatus
);

export default router;
