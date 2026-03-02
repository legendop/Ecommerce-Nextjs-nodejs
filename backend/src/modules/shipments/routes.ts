import { Router } from 'express';
import { body } from 'express-validator';
import {
  getOrderShipments,
  adminListShipments,
  adminGetShipment,
  createShipment,
  updateShipmentStatus,
  shipmentWebhook,
  deleteShipment,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// USER ROUTES
// ==========================================
router.get('/order/:orderId', authenticate, getOrderShipments);

// ==========================================
// WEBHOOK ROUTES (Public - Provider callbacks)
// ==========================================
router.post('/webhook/:provider', shipmentWebhook);

// ==========================================
// ADMIN ROUTES (Manager and above)
// ==========================================

// List all shipments
router.get('/admin/all', authenticate, requireManager, adminListShipments);

// Get single shipment
router.get('/admin/:id', authenticate, requireManager, adminGetShipment);

// Create shipment
router.post(
  '/admin',
  authenticate,
  requireManager,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('provider').trim().notEmpty().withMessage('Provider is required'),
    body('trackingId').optional().trim(),
    body('trackingUrl').optional().trim(),
    body('shipmentStatus').optional().trim(),
  ],
  validate,
  createShipment
);

// Update shipment status
router.patch(
  '/admin/:id/status',
  authenticate,
  requireManager,
  [
    body('shipmentStatus').trim().notEmpty().withMessage('Shipment status is required'),
    body('trackingId').optional().trim(),
    body('trackingUrl').optional().trim(),
  ],
  validate,
  updateShipmentStatus
);

// Delete shipment
router.delete('/admin/:id', authenticate, requireManager, deleteShipment);

export default router;
