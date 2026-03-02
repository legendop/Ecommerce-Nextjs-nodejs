import { Router } from 'express';
import { body } from 'express-validator';
import { sendOtp, verifyOtp, getProfile, updateProfile, listUsers, updateUserRole } from './controller';
import { authenticate, requireManager } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';

const router = Router();

// Send OTP
router.post(
  '/send-otp',
  [
    body('identifier').notEmpty().withMessage('Identifier is required'),
    body('authType').optional().isIn(['PHONE', 'EMAIL']).withMessage('Invalid auth type'),
  ],
  validate,
  sendOtp
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('identifier').notEmpty().withMessage('Identifier is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('authType').optional().isIn(['PHONE', 'EMAIL', 'GOOGLE']),
  ],
  validate,
  verifyOtp
);

// Get current user
router.get('/profile', authenticate, getProfile);

// Update profile
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim(),
    body('avatarUrl').optional().trim(),
  ],
  validate,
  updateProfile
);

// Admin: List all users
router.get('/admin/users', authenticate, requireManager, listUsers);

// Admin: Update user role
router.patch('/admin/users/:id/role', authenticate, requireManager, updateUserRole);

export default router;
