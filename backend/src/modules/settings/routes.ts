import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicSettings,
  getAllSettings,
  updateSetting,
  deleteSetting,
  bulkUpdateSettings,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public endpoint - no auth required
router.get('/public', getPublicSettings);

// Admin endpoints - require authentication and admin role
router.get('/', authenticate, requireAdmin, getAllSettings);

router.put(
  '/:key',
  authenticate,
  requireAdmin,
  validate([
    body('value').notEmpty().withMessage('Value is required'),
    body('type').optional().isIn(['string', 'number', 'boolean', 'json']),
    body('isPublic').optional().isBoolean(),
  ]),
  updateSetting
);

router.post(
  '/bulk',
  authenticate,
  requireAdmin,
  validate([body().isObject().withMessage('Settings object is required')]),
  bulkUpdateSettings
);

router.delete('/:key', authenticate, requireAdmin, deleteSetting);

export default router;
