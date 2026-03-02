import { Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// USER API - Get my orders
// ==========================================
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { page, limit, skip } = getPaginationParams(req);

    const where = { userId: req.user.id };
    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            listing: {
              include: {
                product: {
                  select: { name: true, images: { take: 1 } },
                },
              },
            },
          },
        },
        payments: {
          select: { status: true, provider: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, orders, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Get my orders error:', error);
    errorResponse(res, 'Failed to fetch orders', 500, error);
  }
};

// ==========================================
// USER API - Get single order
// ==========================================
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: BigInt(id), userId: req.user.id },
      include: {
        items: {
          include: {
            listing: {
              include: {
                product: {
                  select: { name: true, images: { take: 1 } },
                },
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
    });

    if (!order) {
      errorResponse(res, 'Order not found', 404);
      return;
    }

    successResponse(res, order);
  } catch (error) {
    logger.error('Get order error:', error);
    errorResponse(res, 'Failed to fetch order', 500, error);
  }
};

// ==========================================
// USER API - Create order
// ==========================================
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { items, addressSnapshot } = req.body;

    // Calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      listingId: bigint;
      productSnapshot: { name: string; size: string | null };
      unitPrice: any;
      discountAmount: any;
      finalUnitPrice: number;
      quantity: number;
      totalAmount: number;
    }> = [];

    for (const item of items) {
      const listing = await prisma.listing.findUnique({
        where: { id: BigInt(item.listingId) },
        include: { product: true },
      });

      if (!listing) {
        errorResponse(res, `Listing ${item.listingId} not found`, 404);
        return;
      }

      if (listing.stock < item.quantity) {
        errorResponse(res, `Insufficient stock for ${listing.product.name}`, 400);
        return;
      }

      const finalPrice = Number(listing.price) - Number(listing.discountAmount);
      const total = finalPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        listingId: listing.id,
        productSnapshot: {
          name: listing.product.name,
          size: listing.size || '',
        },
        unitPrice: listing.price,
        discountAmount: listing.discountAmount,
        finalUnitPrice: finalPrice,
        quantity: item.quantity,
        totalAmount: total,
      });
    }

    const totalAmount = subtotal;
    const orderNumber = `ORD${Date.now()}`;

    const order = await prisma.$transaction(async (tx) => {
      // Update stock
      for (const item of items) {
        await tx.listing.update({
          where: { id: BigInt(item.listingId) },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create order
      return tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          subtotal,
          totalAmount,
          addressSnapshot,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });
    });

    successResponse(res, order, 'Order created successfully', 201);
  } catch (error) {
    logger.error('Create order error:', error);
    errorResponse(res, 'Failed to create order', 500, error);
  }
};

// ==========================================
// ADMIN API - List all orders
// ==========================================
export const adminListOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { orderStatus } = req.query;

    const where: Record<string, unknown> = {};

    if (orderStatus) {
      where.orderStatus = orderStatus as OrderStatus;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          select: { quantity: true, totalAmount: true },
        },
        payments: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    paginatedResponse(res, orders, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list orders error:', error);
    errorResponse(res, 'Failed to fetch orders', 500, error);
  }
};

// ==========================================
// ADMIN API - Get single order
// ==========================================
export const adminGetOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        items: {
          include: {
            listing: {
              include: {
                product: {
                  select: { name: true, images: { take: 1 } },
                },
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
    });

    if (!order) {
      errorResponse(res, 'Order not found', 404);
      return;
    }

    successResponse(res, order);
  } catch (error) {
    logger.error('Admin get order error:', error);
    errorResponse(res, 'Failed to fetch order', 500, error);
  }
};

// ==========================================
// ADMIN API - Update order status
// ==========================================
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await prisma.order.update({
      where: { id: BigInt(id) },
      data: { orderStatus },
    });

    successResponse(res, order, 'Order status updated');
  } catch (error) {
    logger.error('Update order status error:', error);
    errorResponse(res, 'Failed to update order status', 500, error);
  }
};

// ==========================================
// ADMIN API - Cancel order
// ==========================================
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id: BigInt(id) },
      data: { orderStatus: OrderStatus.CANCELLED },
    });

    // Restore stock
    const items = await prisma.orderItem.findMany({
      where: { orderId: BigInt(id) },
    });

    await prisma.$transaction(
      items.map((item) =>
        prisma.listing.update({
          where: { id: item.listingId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    successResponse(res, order, 'Order cancelled');
  } catch (error) {
    logger.error('Cancel order error:', error);
    errorResponse(res, 'Failed to cancel order', 500, error);
  }
};
