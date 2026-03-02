import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

/**
 * Get admin dashboard analytics
 */
export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get total revenue
    const totalRevenueResult = await prisma.order.aggregate({
      where: { paymentStatus: 'SUCCESS' },
      _sum: { totalAmount: true },
    });
    const totalRevenue = Number(totalRevenueResult._sum.totalAmount || 0);

    // Get today's revenue
    const todayRevenueResult = await prisma.order.aggregate({
      where: {
        paymentStatus: 'SUCCESS',
        createdAt: { gte: today },
      },
      _sum: { totalAmount: true },
    });
    const todayRevenue = Number(todayRevenueResult._sum.totalAmount || 0);

    // Get total orders
    const totalOrders = await prisma.order.count();

    // Get today's orders
    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: today } },
    });

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Get top products (via listings)
    const topListings = await prisma.orderItem.groupBy({
      by: ['listingId'],
      _sum: { quantity: true },
      take: 5,
      orderBy: { _sum: { quantity: 'desc' } },
    });

    // Get product details for top listings
    const topProductsWithDetails = await Promise.all(
      topListings.map(async (item) => {
        const listing = await prisma.listing.findUnique({
          where: { id: item.listingId },
          include: { product: { select: { name: true } } },
        });
        return {
          productId: listing?.productId.toString() || item.listingId.toString(),
          productName: listing?.product?.name || 'Unknown',
          totalSold: Number(item._sum.quantity || 0),
        };
      })
    );

    // Get order status counts
    const orderStatusCounts = await prisma.order.groupBy({
      by: ['orderStatus'],
      _count: { orderStatus: true },
    });

    const statusCounts: Record<string, number> = {};
    orderStatusCounts.forEach((status) => {
      statusCounts[status.orderStatus] = status._count.orderStatus;
    });

    successResponse(res, {
      totalRevenue,
      todayRevenue,
      totalOrders,
      todayOrders,
      totalUsers,
      todayUsers: 0, // Would need tracking table
      totalVisits: 0, // Would need analytics tracking
      todayVisits: 0, // Would need analytics tracking
      topProducts: topProductsWithDetails,
      orderStatusCounts: statusCounts,
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    errorResponse(res, 'Failed to fetch dashboard analytics', 500, error);
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
        createdAt: { gte: startDate },
        paymentStatus: 'SUCCESS',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const salesByDate: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + Number(order.totalAmount);
    });

    const chartData = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    successResponse(res, chartData);
  } catch (error) {
    logger.error('Get sales chart error:', error);
    errorResponse(res, 'Failed to fetch sales chart', 500, error);
  }
};

/**
 * Record a visit (public endpoint)
 */
export const recordVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path, referrer } = req.body;

    // For now, just log the visit
    // In production, you would save this to an analytics table
    logger.info(`Visit recorded: ${path} from ${referrer || 'direct'}`);

    successResponse(res, { recorded: true });
  } catch (error) {
    logger.error('Record visit error:', error);
    errorResponse(res, 'Failed to record visit', 500, error);
  }
};
