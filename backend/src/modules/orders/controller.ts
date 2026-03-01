import { Request, Response } from 'express';
import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  createPaginationMeta,
} from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import { generateOrderNumber } from '../../utils/jwt';
import logger from '../../utils/logger';

// Create order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { addressId, items, paymentMethod, couponCode, deliveryCharge = 0 } = req.body;

    // Get address
    const address = await prisma.address.findFirst({
      where: { id: BigInt(addressId), userId: req.user.id },
    });

    if (!address) {
      errorResponse(res, 'Address not found', 404);
      return;
    }

    // Validate items
    let subtotal = 0;
    const orderItemsData: Array<{
      itemId: bigint;
      name: string;
      price: number;
      quantity: number;
      total: number;
      size?: string;
      color?: string;
    }> = [];

    for (const item of items) {
      const itemData = await prisma.item.findUnique({
        where: { id: BigInt(item.itemId || item.productId) },
        include: { catalog: true },
      });

      if (!itemData || !itemData.isActive) {
        errorResponse(res, `Product ${item.itemId || item.productId} not found`, 400);
        return;
      }

      if (itemData.stock < item.quantity) {
        errorResponse(
          res,
          `Insufficient stock for ${itemData.catalog.name}. Available: ${itemData.stock}`,
          400
        );
        return;
      }

      const total = Number(itemData.price) * item.quantity;
      subtotal += total;

      orderItemsData.push({
        itemId: itemData.id,
        name: itemData.catalog.name,
        price: Number(itemData.price),
        quantity: item.quantity,
        total,
        size: itemData.size || undefined,
        color: itemData.color || undefined,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
        (!coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount))
      ) {
        if (coupon.discountType === 'PERCENT') {
          discountAmount = subtotal * (Number(coupon.discountValue) / 100);
          if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
            discountAmount = Number(coupon.maxDiscount);
          }
        } else {
          discountAmount = Number(coupon.discountValue);
        }

        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const totalAmount = subtotal + deliveryCharge - discountAmount;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        addressId: address.id,
        subtotal,
        deliveryCharge,
        discountAmount,
        totalAmount,
        paymentMethod,
        status: OrderStatus.PENDING,
        notes: couponCode ? `Coupon: ${couponCode.toUpperCase()}` : undefined,
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: true,
        address: true,
      },
    });

    // Update item stock
    for (const item of items) {
      await prisma.item.update({
        where: { id: BigInt(item.itemId || item.productId) },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Clear user cart
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    successResponse(res, order, 'Order created successfully', 201);
  } catch (error) {
    logger.error('Create order error:', error);
    errorResponse(res, 'Failed to create order', 500, error);
  }
};

// Get user's orders
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
        orderItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
        address: {
          select: {
            fullName: true,
            line1: true,
            city: true,
            state: true,
          },
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

// Get order details
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { orderNumber } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: req.user.id,
      },
      include: {
        orderItems: true,
        address: true,
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

// Admin: List all orders
export const adminListOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { status, from, to, search } = req.query;

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = status as OrderStatus;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        {
          user: {
            phone: { contains: search as string },
          },
        },
      ];
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        address: {
          select: {
            city: true,
            state: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
          },
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

// Admin: Get order details
export const adminGetOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        orderItems: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
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

// Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierName } = req.body;

    const updateData: Record<string, unknown> = { status };

    // If shipping, can add tracking info
    if (trackingNumber) {
      // TODO: Save tracking info when shipment table is added
      updateData.notes = `Tracking: ${trackingNumber} (${courierName || 'Courier'})`;
    }

    const order = await prisma.order.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    successResponse(res, order, 'Order status updated');
  } catch (error) {
    logger.error('Update order status error:', error);
    errorResponse(res, 'Failed to update order status', 500, error);
  }
};
