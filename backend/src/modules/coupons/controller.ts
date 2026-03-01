import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// Validate coupon
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      errorResponse(res, 'Coupon code is required', 400);
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      errorResponse(res, 'Invalid coupon code', 400);
      return;
    }

    if (!coupon.isActive) {
      errorResponse(res, 'This coupon is not active', 400);
      return;
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      errorResponse(res, 'This coupon has expired', 400);
      return;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      errorResponse(res, 'This coupon has reached its usage limit', 400);
      return;
    }

    if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
      errorResponse(
        res,
        `Minimum order amount of ₹${coupon.minOrderAmount} required`,
        400
      );
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = orderAmount * (Number(coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    successResponse(res, {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  } catch (error) {
    logger.error('Validate coupon error:', error);
    errorResponse(res, 'Failed to validate coupon', 500, error);
  }
};

// Admin: List coupons
export const listCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    const total = await prisma.coupon.count();

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, coupons, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List coupons error:', error);
    errorResponse(res, 'Failed to fetch coupons', 500, error);
  }
};

// Admin: Create coupon
export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = {
      ...req.body,
      code: req.body.code.toUpperCase(),
    };

    const coupon = await prisma.coupon.create({
      data,
    });

    successResponse(res, coupon, 'Coupon created successfully', 201);
  } catch (error) {
    logger.error('Create coupon error:', error);
    errorResponse(res, 'Failed to create coupon', 500, error);
  }
};

// Admin: Update coupon
export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.update({
      where: { id: BigInt(id) },
      data: req.body,
    });

    successResponse(res, coupon, 'Coupon updated successfully');
  } catch (error) {
    logger.error('Update coupon error:', error);
    errorResponse(res, 'Failed to update coupon', 500, error);
  }
};

// Admin: Delete coupon
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.coupon.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Coupon deleted successfully');
  } catch (error) {
    logger.error('Delete coupon error:', error);
    errorResponse(res, 'Failed to delete coupon', 500, error);
  }
};
