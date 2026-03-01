import { Router } from 'express';
import { body } from 'express-validator';
import {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
} from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';

const router = Router();

// All address routes require authentication
router.use(authenticate);

router.get('/', listAddresses);
router.get('/:id', getAddress);

router.post(
  '/',
  validate([
    body('line1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('pincode').optional().trim(),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
  ]),
  createAddress
);

router.patch(
  '/:id',
  validate([
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
  ]),
  updateAddress
);

router.delete('/:id', deleteAddress);

export default router;
