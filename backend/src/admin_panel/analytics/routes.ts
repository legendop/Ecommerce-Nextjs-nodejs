import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import * as controller from '../../modules/analytics/controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Get analytics dashboard data
router.get('/dashboard', controller.getDashboardAnalytics);

// Get sales chart
router.get('/sales', controller.getSalesAnalytics);

// Get product analytics
router.get('/products', controller.getProductAnalytics);

// Get user analytics
router.get('/users', controller.getUserAnalytics);

// Export report
router.get('/export', controller.exportReport);

export default router;
