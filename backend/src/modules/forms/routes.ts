import { Router } from 'express';
import { body } from 'express-validator';
import {
  getForm,
  submitForm,
  adminListForms,
  adminGetForm,
  createForm,
  updateForm,
  deleteForm,
  addFormField,
  deleteFormField,
} from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get('/:slug', getForm);
router.post('/:slug/submit', submitForm);

// ==========================================
// ADMIN ROUTES
// ==========================================
router.get('/admin/all', authenticate, requireManager, adminListForms);
router.get('/admin/:id', authenticate, requireManager, adminGetForm);

router.post(
  '/admin',
  authenticate,
  requireManager,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
  ],
  validate,
  createForm
);

router.patch('/admin/:id', authenticate, requireManager, updateForm);
router.delete('/admin/:id', authenticate, requireManager, deleteForm);

// Form fields
router.post(
  '/admin/:formId/fields',
  authenticate,
  requireManager,
  [
    body('label').trim().notEmpty().withMessage('Label is required'),
    body('fieldKey').trim().notEmpty().withMessage('Field key is required'),
    body('fieldType')
      .isIn(['TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'FILE', 'HIDDEN'])
      .withMessage('Invalid field type'),
  ],
  validate,
  addFormField
);

router.delete('/admin/fields/:id', authenticate, requireManager, deleteFormField);

export default router;
