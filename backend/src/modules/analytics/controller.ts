import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

// Record a visit
export const recordVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path, referrer } = req.body;

    await prisma.visit.create({
      data: {
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined,
        path,
        referrer,
      },
    });

    successResponse(res, null, 'Visit recorded');
  } catch (error) {
    logger.error('Record visit error:', error);
    successResponse(res, null, 'Visit recorded');
  }
};

// Record an event
export const recordEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, entityType, entityId, meta } = req.body;

    await prisma.event.create({
      data: {
        userId: req.user?.id,
        eventType,
        entityType,
        entityId: entityId ? BigInt(entityId) : null,
        meta,
        ipAddress: req.ip || undefined,
      },
    });

    successResponse(res, null, 'Event recorded');
  } catch (error) {
    logger.error('Record event error:', error);
    successResponse(res, null, 'Event recorded');
  }
};

// Admin dashboard stats
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      todayOrders,
      todayRevenue,
      totalVisits,
      todayVisits,
      topProducts,
      orderStatusCounts,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: today },
        },
        _sum: { totalAmount: true },
      }),
      prisma.visit.count(),
      prisma.visit.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.$queryRaw`
        SELECT name, SUM(quantity) as total_sold
        FROM order_items
        GROUP BY name
        ORDER BY total_sold DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT status, COUNT(*) as count
        FROM orders
        GROUP BY status
      `,
    ]);

    const processedTopProducts = (topProducts as Array<{ name: string; total_sold: bigint }>).map(
      (p, index) => ({
        productId: String(index),
        productName: p.name,
        totalSold: Number(p.total_sold),
      })
    );

    const processedStatusCounts = (orderStatusCounts as Array<{ status: string; count: bigint }>).reduce(
      (acc, curr) => {
        acc[curr.status] = Number(curr.count);
        return acc;
      },
      {} as Record<string, number>
    );

    successResponse(res, {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalUsers,
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      totalVisits,
      todayVisits,
      topProducts: processedTopProducts,
      orderStatusCounts: processedStatusCounts,
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    errorResponse(res, 'Failed to fetch stats', 500, error);
  }
};

// Get sales chart data
export const getSalesChart = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'PAID',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += Number(order.totalAmount);
      return acc;
    }, {} as Record<string, { date: string; orders: number; revenue: number }>);

    successResponse(res, Object.values(grouped));
  } catch (error) {
    logger.error('Get sales chart error:', error);
    errorResponse(res, 'Failed to fetch chart data', 500, error);
  }
};

// Admin panel: Get dashboard analytics
export const getDashboardAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      newUsersThisMonth,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: lastMonth } },
      }),
      prisma.order.count({
        where: { status: { in: ['PENDING', 'PAID', 'CONFIRMED'] } },
      }),
      prisma.item.count({
        where: { stock: { lt: 10 }, isActive: true },
      }),
    ]);

    successResponse(res, {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders,
      totalUsers,
      newUsersThisMonth,
      pendingOrders,
      lowStockProducts,
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    errorResponse(res, 'Failed to fetch analytics', 500, error);
  }
};

// Admin panel: Get sales analytics
export const getSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Daily breakdown
    const dailyData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0, paid: 0, pending: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += Number(order.totalAmount);
      if (order.status === 'PAID') {
        acc[date].paid += Number(order.totalAmount);
      } else {
        acc[date].pending += Number(order.totalAmount);
      }
      return acc;
    }, {} as Record<string, { date: string; orders: number; revenue: number; paid: number; pending: number }>);

    // Payment method breakdown
    const paymentMethods = await prisma.$queryRaw`
      SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
      FROM orders
      WHERE created_at >= ${startDate}
      GROUP BY payment_method
    `;

    successResponse(res, {
      daily: Object.values(dailyData),
      paymentMethods: paymentMethods as Array<{ payment_method: string; count: bigint; total: unknown }>,
    });
  } catch (error) {
    logger.error('Get sales analytics error:', error);
    errorResponse(res, 'Failed to fetch sales analytics', 500, error);
  }
};

// Admin panel: Get product analytics
export const getProductAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topProducts = await prisma.$queryRaw`
      SELECT
        c.name as catalog_name,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN items i ON oi.item_id = i.id
      JOIN catalogs c ON i.catalog_id = c.id
      WHERE o.created_at >= ${startDate}
      GROUP BY c.id, c.name
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    const stockAlerts = await prisma.item.findMany({
      where: {
        stock: { lt: 10 },
        isActive: true,
      },
      include: {
        catalog: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
      take: 20,
    });

    successResponse(res, {
      topProducts: topProducts as Array<{
        catalog_name: string;
        order_count: bigint;
        total_sold: bigint;
        total_revenue: unknown;
      }>,
      stockAlerts: stockAlerts.map((item) => ({
        id: item.id.toString(),
        name: item.catalog.name,
        sku: item.skuCode,
        stock: item.stock,
        size: item.size,
        color: item.color,
      })),
    });
  } catch (error) {
    logger.error('Get product analytics error:', error);
    errorResponse(res, 'Failed to fetch product analytics', 500, error);
  }
};

// Admin panel: Get user analytics
export const getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.order.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
        _count: { userId: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    successResponse(res, {
      totalUsers,
      newUsers,
      activeUsers: activeUsers.length,
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        count: r._count.id,
      })),
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    errorResponse(res, 'Failed to fetch user analytics', 500, error);
  }
};

// Admin panel: Export report
export const exportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'orders', from, to } = req.query;
    const startDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to as string) : new Date();

    let data: unknown[] = [];
    let filename = `${type}_report_${startDate.toISOString().split('T')[0]}.csv`;

    switch (type) {
      case 'orders': {
        const orders = await prisma.order.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            user: { select: { name: true, phone: true } },
            orderItems: true,
          },
        });
        data = orders.map((o) => ({
          orderNumber: o.orderNumber,
          date: o.createdAt.toISOString(),
          customer: o.user?.name || 'Guest',
          phone: o.user?.phone || '',
          total: o.totalAmount,
          status: o.status,
          items: o.orderItems.length,
        }));
        break;
      }

      case 'products': {
        const products = await prisma.$queryRaw`
          SELECT
            c.name as catalog_name,
            COUNT(DISTINCT o.id) as order_count,
            SUM(oi.quantity) as total_sold,
            SUM(oi.total) as total_revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN items i ON oi.item_id = i.id
          JOIN catalogs c ON i.catalog_id = c.id
          WHERE o.created_at >= ${startDate} AND o.created_at <= ${endDate}
          GROUP BY c.id, c.name
          ORDER BY total_sold DESC
        `;
        data = products as unknown[];
        break;
      }

      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        });
        data = users.map((u) => ({
          id: u.id.toString(),
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          registered: u.createdAt.toISOString(),
          orders: u._count.orders,
        }));
        break;
      }

      default:
        errorResponse(res, 'Invalid report type', 400);
        return;
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Convert to CSV
    if (data.length === 0) {
      res.send('No data available');
      return;
    }

    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = (row as Record<string, unknown>)[h];
            // Escape quotes and wrap in quotes if contains comma
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\n');

    res.send(csv);
  } catch (error) {
    logger.error('Export report error:', error);
    errorResponse(res, 'Failed to generate report', 500, error);
  }
};
