import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  adminListProducts,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public routes
router.get('/', listProducts);
router.get('/:slug', getProduct);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, adminListProducts);

router.post(
  '/admin',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('categoryId')
      .optional()
      .isNumeric()
      .withMessage('Invalid category ID'),
  ]),
  createProduct
);

router.patch(
  '/admin/:id',
  authenticate,
  requireAdmin,
  validate([
    param('id').isNumeric().withMessage('Invalid product ID'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
  ]),
  updateProduct
);

router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  validate([param('id').isNumeric().withMessage('Invalid product ID')]),
  deleteProduct
);

export default router;
