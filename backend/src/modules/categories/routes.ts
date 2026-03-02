import { Router } from 'express';
import { body } from 'express-validator';
import {
  listCategories,
  getCategory,
  adminListCategories,
  adminGetCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategoryProducts,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// List all active categories
router.get('/', listCategories);

// Get single category with products (by slug)
router.get('/:slug', getCategory);

// ==========================================
// ADMIN ROUTES (Manager and above)
// ==========================================

// List all categories with full details (including inactive)
router.get('/admin/all', authenticate, requireManager, adminListCategories);

// Get single category by ID with all details
router.get('/admin/:id', authenticate, requireManager, adminGetCategory);

// Create new category
router.post(
  '/admin',
  authenticate,
  requireManager,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('description').optional().trim(),
    body('cardImage').optional().trim(),
    body('bannerImage').optional().trim(),
    body('parentId').optional().isNumeric().withMessage('Parent ID must be a number'),
    body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
  ],
  validate,
  createCategory
);

// Update category
router.patch(
  '/admin/:id',
  authenticate,
  requireManager,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().notEmpty().withMessage('Slug cannot be empty'),
    body('description').optional().trim(),
    body('cardImage').optional().trim(),
    body('bannerImage').optional().trim(),
    body('parentId').optional({ nullable: true }).isNumeric().withMessage('Parent ID must be a number'),
    body('sortOrder').optional().isInt().withMessage('Sort order must be an integer'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  updateCategory
);

// Delete category (soft delete)
router.delete('/admin/:id', authenticate, requireManager, deleteCategory);

// Reorder products within category
router.post(
  '/admin/:id/reorder',
  authenticate,
  requireManager,
  [
    body('productOrders').isArray().withMessage('productOrders must be an array'),
    body('productOrders.*.productId').notEmpty().withMessage('productId is required'),
    body('productOrders.*.sortOrder').isInt().withMessage('sortOrder must be an integer'),
  ],
  validate,
  reorderCategoryProducts
);

export default router;
