import { Router } from 'express';
import { body } from 'express-validator';
import {
  getForm,
  submitForm,
  listForms,
  createForm,
  updateForm,
  deleteForm,
  addFormField,
  updateFormField,
  deleteFormField,
  getFormSubmissions,
} from './controller';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// Public routes
router.get('/:slug', getForm);
router.post('/:slug/submit', optionalAuth, submitForm);

// Admin routes
router.use('/admin', authenticate, requireAdmin);

router.get('/admin/forms', listForms);

router.post(
  '/admin/forms',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
  ]),
  createForm
);

router.patch('/admin/forms/:id', updateForm);
router.delete('/admin/forms/:id', deleteForm);

// Form fields
router.post(
  '/admin/forms/:id/fields',
  validate([
    body('label').trim().notEmpty().withMessage('Label is required'),
    body('fieldKey').trim().notEmpty().withMessage('Field key is required'),
    body('fieldType')
      .isIn(['TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'FILE', 'HIDDEN'])
      .withMessage('Invalid field type'),
  ]),
  addFormField
);

router.patch('/admin/fields/:fieldId', updateFormField);
router.delete('/admin/fields/:fieldId', deleteFormField);

// Form submissions
router.get('/admin/forms/:id/submissions', getFormSubmissions);

export default router;
