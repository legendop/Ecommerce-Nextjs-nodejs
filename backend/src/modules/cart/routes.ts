import { Router } from 'express';
import { body } from 'express-validator';
import {
  validateCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Validate cart (public, no auth required)
router.post(
  '/validate',
  validate([
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items array is required'),
    body('items.*.productId')
      .notEmpty()
      .withMessage('Product ID is required'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ]),
  validateCart
);

// Cart operations require auth
router.use(authenticate);

router.get('/', getCart);

router.post(
  '/',
  validate([
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ]),
  addToCart
);

router.patch(
  '/:id',
  validate([
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('Quantity must be 0 or more'),
  ]),
  updateCartItem
);

router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
