import { Router } from 'express';
import { body } from 'express-validator';
import { sendOtp, verifyOtp, getMe, logout, updateProfile } from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validateRequest';
import { otpLimiter, loginLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Send OTP
router.post(
  '/send-otp',
  otpLimiter,
  validate([
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Invalid phone number format'),
  ]),
  sendOtp
);

// Verify OTP
router.post(
  '/verify-otp',
  loginLimiter,
  validate([
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Invalid phone number format'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .matches(/^[0-9]{6}$/)
      .withMessage('OTP must be 6 digits'),
  ]),
  verifyOtp
);

// Get current user
router.get('/me', authenticate, getMe);

// Logout
router.post('/logout', logout);

// Update profile
router.patch(
  '/profile',
  authenticate,
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('Name must be between 2 and 120 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
  ]),
  updateProfile
);

export default router;
