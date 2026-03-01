import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCatalogReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  adminListReviews,
  verifyReview,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public routes
router.get(
  '/catalog/:catalogId',
  validate([param('catalogId').isNumeric().withMessage('Invalid catalog ID')]),
  getCatalogReviews
);

// Authenticated user routes
router.use(authenticate);

router.get('/my-reviews', getMyReviews);

router.post(
  '/',
  validate([
    body('catalogId').isNumeric().withMessage('Catalog ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage('Comment must be between 3 and 1000 characters'),
  ]),
  createReview
);

router.patch(
  '/:id',
  validate([
    param('id').isNumeric().withMessage('Invalid review ID'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ min: 3, max: 1000 }),
  ]),
  updateReview
);

router.delete('/:id', deleteReview);

// Admin routes
router.get('/admin/all', requireAdmin, adminListReviews);
router.patch('/admin/:id/verify', requireAdmin, verifyReview);

export default router;
