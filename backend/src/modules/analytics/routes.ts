import { Router } from 'express';
import { body } from 'express-validator';
import {
  recordVisit,
  recordEvent,
  getDashboardStats,
  getSalesChart,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public - record visit
router.post(
  '/visit',
  validate([
    body('path').optional().trim(),
    body('referrer').optional().trim(),
  ]),
  recordVisit
);

// Record event (optional auth)
router.post(
  '/event',
  authenticate,
  validate([
    body('eventType').notEmpty().withMessage('Event type is required'),
    body('entityType').optional().trim(),
    body('entityId').optional(),
    body('meta').optional().isObject(),
  ]),
  recordEvent
);

// Admin routes
router.get('/admin/dashboard', authenticate, requireAdmin, getDashboardStats);
router.get('/admin/sales-chart', authenticate, requireAdmin, getSalesChart);

export default router;
