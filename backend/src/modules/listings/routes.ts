import { Router } from 'express';
import { body } from 'express-validator';
import {
  getListing,
  getListingsByProduct,
  adminListListings,
  adminGetListing,
  createListing,
  updateListing,
  updateStock,
  bulkUpdateStock,
  deleteListing,
  toggleListingStatus,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get single listing by ID
router.get('/:id', getListing);

// Get listings by product slug
router.get('/product/:productSlug', getListingsByProduct);

// ==========================================
// ADMIN ROUTES (Manager and above)
// ==========================================

// List all listings with filters
router.get('/admin/all', authenticate, requireManager, adminListListings);

// Get single listing by ID with full details
router.get('/admin/:id', authenticate, requireManager, adminGetListing);

// Create listing
router.post(
  '/admin',
  authenticate,
  requireManager,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('skuCode').optional().trim(),
    body('size').optional().trim(),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('maxPrice').optional().isNumeric(),
    body('discountPercent').optional().isNumeric(),
    body('stock').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  createListing
);

// Update listing
router.patch(
  '/admin/:id',
  authenticate,
  requireManager,
  [
    body('skuCode').optional().trim(),
    body('size').optional().trim(),
    body('price').optional().isNumeric(),
    body('maxPrice').optional().isNumeric(),
    body('discountPercent').optional().isNumeric(),
    body('stock').optional().isInt({ min: 0 }),
    body('reservedStock').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateListing
);

// Update stock
router.patch(
  '/admin/:id/stock',
  authenticate,
  requireManager,
  [
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  ],
  validate,
  updateStock
);

// Bulk update stock
router.post(
  '/admin/bulk-stock',
  authenticate,
  requireManager,
  [
    body('updates').isArray().withMessage('updates must be an array'),
    body('updates.*.listingId').notEmpty().withMessage('listingId is required'),
    body('updates.*.stock').isInt({ min: 0 }).withMessage('stock must be a non-negative integer'),
  ],
  validate,
  bulkUpdateStock
);

// Delete listing
router.delete('/admin/:id', authenticate, requireManager, deleteListing);

// Toggle listing status
router.patch('/admin/:id/toggle', authenticate, requireManager, toggleListingStatus);

export default router;
