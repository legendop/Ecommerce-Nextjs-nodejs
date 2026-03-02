import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { OrderStatus } from '@prisma/client';
import { successResponse, errorResponse, paginatedResponse, createPaginationMeta } from '../../utils/response';
import { getPaginationParams } from '../../utils/pagination';
import logger from '../../utils/logger';

// ==========================================
// USER API - Get shipments for user's order
// ==========================================
export const getOrderShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: BigInt(orderId), userId },
    });

    if (!order) {
      errorResponse(res, 'Order not found', 404);
      return;
    }

    const shipments = await prisma.shipment.findMany({
      where: { orderId: BigInt(orderId) },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, shipments);
  } catch (error) {
    logger.error('Get order shipments error:', error);
    errorResponse(res, 'Failed to fetch shipments', 500, error);
  }
};

// ==========================================
// ADMIN API - List all shipments
// ==========================================
export const adminListShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { orderId, provider, status, trackingId } = req.query;

    const where: Record<string, unknown> = {};

    if (orderId) where.orderId = BigInt(orderId as string);
    if (provider) where.provider = provider as string;
    if (status) where.shipmentStatus = status as string;
    if (trackingId) where.trackingId = { contains: trackingId as string };

    const total = await prisma.shipment.count({ where });

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            userId: true,
            orderStatus: true,
          },
        },
      },
    });

    paginatedResponse(res, shipments, createPaginationMeta(page, limit, total));
  } catch (error) {
    logger.error('Admin list shipments error:', error);
    errorResponse(res, 'Failed to fetch shipments', 500, error);
  }
};

// ==========================================
// ADMIN API - Get single shipment
// ==========================================
export const adminGetShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: BigInt(id) },
      include: {
        order: {
          include: {
            items: {
              include: {
                listing: {
                  include: {
                    product: {
                      select: { id: true, name: true, slug: true },
                    },
                  },
                },
              },
            },
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      errorResponse(res, 'Shipment not found', 404);
      return;
    }

    successResponse(res, shipment);
  } catch (error) {
    logger.error('Admin get shipment error:', error);
    errorResponse(res, 'Failed to fetch shipment', 500, error);
  }
};

// ==========================================
// ADMIN API - Create shipment
// ==========================================
export const createShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      provider,
      providerOrderId,
      trackingId,
      trackingUrl,
      shipmentStatus,
      rawResponse,
    } = req.body;

    const shipment = await prisma.shipment.create({
      data: {
        orderId: BigInt(orderId),
        provider,
        providerOrderId,
        trackingId,
        trackingUrl,
        shipmentStatus: shipmentStatus || 'CREATED',
        rawResponse: rawResponse || {},
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    // Update order status if shipment created
    if (shipmentStatus === 'SHIPPED') {
      await prisma.order.update({
        where: { id: BigInt(orderId) },
        data: { orderStatus: 'SHIPPED' },
      });
    }

    successResponse(res, shipment, 'Shipment created successfully', 201);
  } catch (error) {
    logger.error('Create shipment error:', error);
    errorResponse(res, 'Failed to create shipment', 500, error);
  }
};

// ==========================================
// ADMIN API - Update shipment status
// ==========================================
export const updateShipmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { shipmentStatus, trackingId, trackingUrl, rawResponse } = req.body;

    const shipment = await prisma.shipment.update({
      where: { id: BigInt(id) },
      data: {
        shipmentStatus,
        trackingId,
        trackingUrl,
        rawResponse: rawResponse ? { ...rawResponse } : undefined,
      },
      include: {
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    // Sync order status with shipment status
    const statusMap: Record<string, OrderStatus> = {
      'SHIPPED': 'SHIPPED',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
    };

    if (statusMap[shipmentStatus]) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { orderStatus: statusMap[shipmentStatus] as OrderStatus },
      });
    }

    successResponse(res, shipment, 'Shipment status updated successfully');
  } catch (error) {
    logger.error('Update shipment status error:', error);
    errorResponse(res, 'Failed to update shipment status', 500, error);
  }
};

// ==========================================
// ADMIN API - Webhook handler for shipment updates
// ==========================================
export const shipmentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const payload = req.body;

    logger.info(`Shipment webhook received from ${provider}:`, payload);

    // Process webhook based on provider
    // This is a generic handler - specific providers can override

    successResponse(res, { received: true });
  } catch (error) {
    logger.error('Shipment webhook error:', error);
    errorResponse(res, 'Failed to process webhook', 500, error);
  }
};

// ==========================================
// ADMIN API - Delete shipment
// ==========================================
export const deleteShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.shipment.delete({
      where: { id: BigInt(id) },
    });

    successResponse(res, null, 'Shipment deleted successfully');
  } catch (error) {
    logger.error('Delete shipment error:', error);
    errorResponse(res, 'Failed to delete shipment', 500, error);
  }
};
