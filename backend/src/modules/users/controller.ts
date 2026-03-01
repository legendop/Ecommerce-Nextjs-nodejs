import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  createPaginationMeta,
} from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// List all users (admin)
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { role, search } = req.query;

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role as Role;
    }

    if (search) {
      where.OR = [
        { phone: { contains: search as string } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, users, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('List users error:', error);
    errorResponse(res, 'Failed to fetch users', 500, error);
  }
};

// Get single user (admin)
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
    });

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    successResponse(res, user);
  } catch (error) {
    logger.error('Get user error:', error);
    errorResponse(res, 'Failed to fetch user', 500, error);
  }
};

// Update user (admin)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { name, email, role, isActive },
    });

    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    logger.error('Update user error:', error);
    errorResponse(res, 'Failed to update user', 500, error);
  }
};

// Deactivate user (admin)
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    successResponse(res, null, 'User deactivated successfully');
  } catch (error) {
    logger.error('Deactivate user error:', error);
    errorResponse(res, 'Failed to deactivate user', 500, error);
  }
};

// Toggle user status (admin)
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { isActive: true },
    });

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    const updated = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { isActive: !user.isActive },
    });

    successResponse(res, updated, `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    logger.error('Toggle user status error:', error);
    errorResponse(res, 'Failed to toggle user status', 500, error);
  }
};
