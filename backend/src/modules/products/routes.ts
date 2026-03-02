import { Router } from 'express';
import { body } from 'express-validator';
import {
  listProducts,
  getProductDetails,
  adminListProducts,
  adminGetProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// List products with filters
router.get('/', listProducts);

// Get product details (for product page)
router.get('/details/:slug', getProductDetails);

// ==========================================
// ADMIN ROUTES (Manager and above)
// ==========================================

// List all products with full details
router.get('/admin/all', authenticate, requireManager, adminListProducts);

// Get single product by ID with all details
router.get('/admin/:id', authenticate, requireManager, adminGetProduct);

// Create product with listings and images
router.post(
  '/admin',
  authenticate,
  requireManager,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('description').optional().trim(),
    body('colorName').optional().trim(),
    body('colorCode').optional().trim(),
    body('gender').optional().trim(),
    body('categoryIds').optional().isArray().withMessage('categoryIds must be an array'),
    body('images').optional().isArray().withMessage('images must be an array'),
    body('images.*.imageUrl').notEmpty().withMessage('imageUrl is required'),
    body('listings').optional().isArray().withMessage('listings must be an array'),
    body('listings.*.price').isNumeric().withMessage('price must be a number'),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt(),
  ],
  validate,
  createProduct
);

// Update product with listings and images
router.patch(
  '/admin/:id',
  authenticate,
  requireManager,
  [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('colorName').optional().trim(),
    body('colorCode').optional().trim(),
    body('gender').optional().trim(),
    body('categoryIds').optional().isArray(),
    body('images').optional().isArray(),
    body('listings').optional().isArray(),
    body('isActive').optional().isBoolean(),
    body('sortOrder').optional().isInt(),
  ],
  validate,
  updateProduct
);

// Delete product (soft delete)
router.delete('/admin/:id', authenticate, requireManager, deleteProduct);

// Toggle product status
router.patch('/admin/:id/toggle', authenticate, requireManager, toggleProductStatus);

export default router;
