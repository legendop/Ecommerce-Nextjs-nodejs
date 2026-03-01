import { Router } from 'express';
import { body } from 'express-validator';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public routes
router.get('/', listCategories);
router.get('/:slug', getCategory);

// Admin routes
router.post(
  '/admin',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
  ]),
  createCategory
);

router.patch(
  '/admin/:id',
  authenticate,
  requireAdmin,
  updateCategory
);

router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  deleteCategory
);

export default router;
