import { Router } from 'express';
import { body } from 'express-validator';
import {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
} from './controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listUsers);
router.get('/:id', getUser);

router.patch(
  '/:id',
  [
    body('role')
      .optional()
      .isIn(['USER', 'ADMIN', 'MANAGER'])
      .withMessage('Invalid role'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    validate,
  ],
  updateUser
);

router.delete('/:id', deactivateUser);

export default router;
