import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import * as controller from './controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', controller.getDashboardStats);
router.get('/recent-orders', controller.getRecentOrders);
router.get('/sales-chart', controller.getSalesChart);

export default router;
