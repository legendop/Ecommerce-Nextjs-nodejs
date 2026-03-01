import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      pendingOrders,
      todayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.catalog.count({ where: { isActive: true } }),
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    successResponse(res, {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: totalRevenue._sum?.totalAmount || 0,
      pendingOrders,
      todayOrders,
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    errorResponse(res, 'Failed to fetch dashboard stats', 500, error);
  }
};

/**
 * Get recent orders for dashboard
 */
export const getRecentOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
          },
        },
      },
    });

    successResponse(res, orders);
  } catch (error) {
    logger.error('Get recent orders error:', error);
    errorResponse(res, 'Failed to fetch recent orders', 500, error);
  }
};

/**
 * Get sales chart data
 */
export const getSalesChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: 'PAID',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Group by date
    const grouped = orders.reduce((acc: Record<string, number>, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(order.totalAmount);
      return acc;
    }, {});

    // Fill missing dates
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        amount: grouped[dateStr] || 0,
      });
    }

    successResponse(res, result);
  } catch (error) {
    logger.error('Get sales chart error:', error);
    errorResponse(res, 'Failed to fetch sales chart', 500, error);
  }
};
