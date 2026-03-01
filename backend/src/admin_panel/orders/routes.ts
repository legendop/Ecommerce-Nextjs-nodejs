import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import * as controller from '../../modules/orders/controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// List all orders
router.get('/', controller.adminListOrders);

// Get order details
router.get('/:id', controller.adminGetOrder);

// Update order status
router.patch('/:id/status', controller.updateOrderStatus);

export default router;
