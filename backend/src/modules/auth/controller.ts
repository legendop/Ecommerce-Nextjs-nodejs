import { Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { generateToken, generateOtp } from '../../utils/jwt';
import { successResponse, errorResponse } from '../../utils/response';
import config from '../../config';
import logger from '../../utils/logger';

// Send OTP
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await hash(otp, 10);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete old OTPs for this phone
    await prisma.otpCode.deleteMany({
      where: { phone },
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashedOtp,
        expiresAt,
      },
    });

    // TODO: Send SMS using Twilio or other provider
    // For development, we'll log it
    if (config.NODE_ENV === 'development') {
      logger.info(`🔐 OTP for ${phone}: ${otp}`);
    }

    successResponse(res, null, 'OTP sent successfully');
  } catch (error) {
    logger.error('Send OTP error:', error);
    errorResponse(res, 'Failed to send OTP', 500, error);
  }
};

// Verify OTP and Login
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      errorResponse(res, 'OTP expired or not found', 400);
      return;
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      errorResponse(res, 'Too many failed attempts. Request new OTP', 400);
      return;
    }

    // Verify OTP
    const isValid = await compare(otp, otpRecord.codeHash);

    if (!isValid) {
      // Increment attempts
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      errorResponse(res, 'Invalid OTP', 400);
      return;
    }

    // Mark OTP as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone,
          role: phone === config.ADMIN_PHONE ? 'ADMIN' : 'USER',
        },
      });
    }

    if (!user.isActive) {
      errorResponse(res, 'Account is deactivated', 403);
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = generateToken({
      userId: user.id.toString(),
      phone: user.phone,
      role: user.role,
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.COOKIE_MAX_AGE,
    });

    successResponse(res, {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (error) {
    logger.error('Verify OTP error:', error);
    errorResponse(res, 'Failed to verify OTP', 500, error);
  }
};

// Get current user
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    successResponse(res, {
      id: req.user.id,
      phone: req.user.phone,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    errorResponse(res, 'Failed to get user', 500, error);
  }
};

// Logout
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  successResponse(res, null, 'Logged out successfully');
};

// Update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email },
    });

    successResponse(res, {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
    }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    errorResponse(res, 'Failed to update profile', 500, error);
  }
};
