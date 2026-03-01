import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkDelivery,
  getSettings,
  updateSettings,
  createShipment,
  trackShipment,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public route - check delivery availability by pincode
router.post(
  '/check',
  validate([
    body('pincode').notEmpty().withMessage('Pincode is required'),
  ]),
  checkDelivery
);

// Admin routes
router.use(authenticate, requireAdmin);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// Shipment management - placeholders for third-party integration
router.post('/shipments/:orderId', createShipment);
router.get('/shipments/:orderId/track', trackShipment);

export default router;
