import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import * as controller from '../../modules/users/controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// List all users
router.get('/', controller.listUsers);

// Get user details
router.get('/:id', controller.getUser);

// Update user
router.patch('/:id', controller.updateUser);

// Toggle user status
router.patch('/:id/toggle-status', controller.toggleUserStatus);

export default router;
