import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  markHelpful,
  adminListReviews,
  adminGetReview,
  verifyReview,
  adminDeleteReview,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get(
  '/product/:productId',
  [param('productId').isNumeric().withMessage('Invalid product ID')],
  validate,
  getProductReviews
);

// Mark helpful (no auth needed, but could rate limit)
router.post('/:id/helpful', markHelpful);

// ==========================================
// AUTHENTICATED USER ROUTES
// ==========================================
router.use(authenticate);

router.get('/my-reviews', getMyReviews);

router.post(
  '/',
  [
    body('productId').isNumeric().withMessage('Product ID is required'),
    body('orderId').isNumeric().withMessage('Order ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title').optional().trim(),
    body('comment').optional().trim(),
    body('images').optional().isArray(),
  ],
  validate,
  createReview
);

router.patch(
  '/:id',
  [
    param('id').isNumeric().withMessage('Invalid review ID'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('title').optional().trim(),
    body('comment').optional().trim(),
    body('images').optional().isArray(),
  ],
  validate,
  updateReview
);

router.delete('/:id', deleteReview);

// ==========================================
// ADMIN ROUTES (Manager and above)
// ==========================================
router.get('/admin/all', requireManager, adminListReviews);
router.get('/admin/:id', requireManager, adminGetReview);
router.patch('/admin/:id/verify', requireManager, verifyReview);
router.delete('/admin/:id', requireManager, adminDeleteReview);

export default router;
