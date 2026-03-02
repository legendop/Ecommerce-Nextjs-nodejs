import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMyOrders,
  getOrder,
  createOrder,
  adminListOrders,
  adminGetOrder,
  updateOrderStatus,
  cancelOrder,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// USER ROUTES
// ==========================================
router.get('/my', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrder);
router.post(
  '/',
  authenticate,
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.listingId').notEmpty().withMessage('Listing ID required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('addressSnapshot').isObject().withMessage('Address snapshot required'),
  ],
  validate,
  createOrder
);

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get('/admin/all', authenticate, requireManager, adminListOrders);
router.get('/admin/:id', authenticate, requireManager, adminGetOrder);
router.patch(
  '/admin/:id/status',
  authenticate,
  requireManager,
  [body('orderStatus').notEmpty().withMessage('Order status required')],
  validate,
  updateOrderStatus
);
router.patch('/admin/:id/cancel', authenticate, requireManager, cancelOrder);

export default router;
