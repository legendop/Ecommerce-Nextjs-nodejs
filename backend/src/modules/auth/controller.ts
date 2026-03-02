import { Request, Response } from 'express';
import { AuthType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import { generateToken } from '../../utils/jwt';
import logger from '../../utils/logger';
import crypto from 'crypto';

// ==========================================
// Send OTP to phone/email
// ==========================================
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, authType } = req.body;

    if (!identifier || !authType) {
      errorResponse(res, 'Identifier and auth type required', 400);
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    await prisma.otpVerification.create({
      data: {
        identifier,
        otpCode: crypto.createHash('sha256').update(otp).digest('hex'),
        expiresAt,
      },
    });

    // TODO: Send OTP via SMS/Email based on authType
    logger.info(`OTP for ${identifier}: ${otp}`);

    successResponse(res, { sent: true }, 'OTP sent successfully');
  } catch (error) {
    logger.error('Send OTP error:', error);
    errorResponse(res, 'Failed to send OTP', 500, error);
  }
};

// ==========================================
// Verify OTP and login/register
// ==========================================
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, otp, authType = AuthType.PHONE } = req.body;

    // Find valid OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      errorResponse(res, 'OTP expired or invalid', 400);
      return;
    }

    // Verify OTP hash
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== otpRecord.otpCode) {
      errorResponse(res, 'Invalid OTP', 400);
      return;
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Find or create user auth
    let userAuth = await prisma.userAuth.findUnique({
      where: { authType_identifier: { authType, identifier } },
      include: { user: true },
    });

    let user;
    if (!userAuth) {
      // Create new user
      user = await prisma.user.create({
        data: {
          role: Role.USER,
          authMethods: {
            create: {
              authType,
              identifier,
              isVerified: true,
            },
          },
        },
      });
    } else {
      user = userAuth.user;
      // Update verified status
      await prisma.userAuth.update({
        where: { id: userAuth.id },
        data: { isVerified: true },
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id.toString(),
      role: user.role,
    });

    successResponse(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    }, 'Login successful');
  } catch (error) {
    logger.error('Verify OTP error:', error);
    errorResponse(res, 'Failed to verify OTP', 500, error);
  }
};

// ==========================================
// Get current user profile
// ==========================================
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        authMethods: {
          select: { authType: true, identifier: true, isVerified: true },
        },
        addresses: true,
      },
    });

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    successResponse(res, user);
  } catch (error) {
    logger.error('Get profile error:', error);
    errorResponse(res, 'Failed to fetch profile', 500, error);
  }
};

// ==========================================
// Update user profile
// ==========================================
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { name, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatarUrl },
    });

    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    errorResponse(res, 'Failed to update profile', 500, error);
  }
};

// ==========================================
// Admin: List all users
// ==========================================
export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        authMethods: {
          select: { authType: true, identifier: true },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, users);
  } catch (error) {
    logger.error('List users error:', error);
    errorResponse(res, 'Failed to fetch users', 500, error);
  }
};

// ==========================================
// Admin: Update user role
// ==========================================
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { role },
    });

    successResponse(res, user, 'User role updated');
  } catch (error) {
    logger.error('Update user role error:', error);
    errorResponse(res, 'Failed to update user role', 500, error);
  }
};
