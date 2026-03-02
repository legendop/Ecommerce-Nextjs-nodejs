import { Request, Response } from 'express';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

// ==========================================
// Create payment intent
// ==========================================
export const createPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { orderId, provider } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: BigInt(orderId), userId: req.user.id },
    });

    if (!order) {
      errorResponse(res, 'Order not found', 404);
      return;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: BigInt(orderId),
        provider,
        amount: order.totalAmount,
        status: PaymentStatus.CREATED,
      },
    });

    // TODO: Integrate with actual payment gateway (Razorpay, Stripe, etc.)
    // Return provider-specific order ID

    successResponse(res, { paymentId: payment.id }, 'Payment initiated');
  } catch (error) {
    logger.error('Create payment error:', error);
    errorResponse(res, 'Failed to create payment', 500, error);
  }
};

// ==========================================
// Verify payment (webhook or manual)
// ==========================================
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId, providerPaymentId, signature } = req.body;

    // Update payment
    const payment = await prisma.payment.update({
      where: { id: BigInt(paymentId) },
      data: {
        providerPaymentId,
        providerSignature: signature,
        status: PaymentStatus.SUCCESS,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: PaymentStatus.SUCCESS,
        orderStatus: OrderStatus.CONFIRMED,
        placedAt: new Date(),
      },
    });

    successResponse(res, payment, 'Payment verified');
  } catch (error) {
    logger.error('Verify payment error:', error);
    errorResponse(res, 'Failed to verify payment', 500, error);
  }
};

// ==========================================
// Get payment status
// ==========================================
export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!payment) {
      errorResponse(res, 'Payment not found', 404);
      return;
    }

    successResponse(res, payment);
  } catch (error) {
    logger.error('Get payment status error:', error);
    errorResponse(res, 'Failed to fetch payment', 500, error);
  }
};

// ==========================================
// Webhook handler
// ==========================================
export const paymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;
    const payload = req.body;

    logger.info(`Payment webhook from ${provider}:`, payload);

    // Process webhook based on provider
    // Update payment status accordingly

    successResponse(res, { received: true });
  } catch (error) {
    logger.error('Payment webhook error:', error);
    errorResponse(res, 'Failed to process webhook', 500, error);
  }
};

// ==========================================
// Admin: List payments
// ==========================================
export const adminListPayments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          select: { orderNumber: true, userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, payments);
  } catch (error) {
    logger.error('Admin list payments error:', error);
    errorResponse(res, 'Failed to fetch payments', 500, error);
  }
};
