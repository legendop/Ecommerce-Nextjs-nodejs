import { Router } from 'express';
import { getDashboard, getSalesChart, recordVisit } from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';

const router = Router();

// Public: Record a visit
router.post('/visit', recordVisit);

// Admin: Get dashboard analytics
router.get('/admin/dashboard', authenticate, requireManager, getDashboard);

// Admin: Get sales chart data
router.get('/admin/sales-chart', authenticate, requireManager, getSalesChart);

export default router;
