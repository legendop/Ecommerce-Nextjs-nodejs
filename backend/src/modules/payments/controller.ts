import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { successResponse, errorResponse } from '../../utils/response';
import config from '../../config';
import logger from '../../utils/logger';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
export const createRazorpayOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Not authenticated', 401);
      return;
    }

    const { orderId } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: req.user.id,
        paymentMethod: 'RAZORPAY',
        status: 'PENDING',
      },
    });

    if (!order) {
      errorResponse(res, 'Order not found or invalid', 404);
      return;
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id.toString(),
        userId: req.user.id.toString(),
      },
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'RAZORPAY',
        providerOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    successResponse(res, {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: config.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    logger.error('Create Razorpay order error:', error);
    errorResponse(res, 'Failed to create payment order', 500, error);
  }
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      errorResponse(res, 'Invalid payment signature', 400);
      return;
    }

    // Get payment record by providerOrderId using findFirst
    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: razorpay_order_id },
    });

    if (!payment) {
      errorResponse(res, 'Payment record not found', 404);
      return;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'PAID',
        rawResponse: req.body,
      },
    });

    // Update order status to PAID
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
    });

    successResponse(res, { orderId: payment.orderId }, 'Payment verified successfully');
  } catch (error) {
    logger.error('Verify Razorpay payment error:', error);
    errorResponse(res, 'Failed to verify payment', 500, error);
  }
};

// Handle Razorpay webhook
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const { event, payload } = req.body;

    if (event === 'payment.captured') {
      const { order_id, id: payment_id } = payload.payment.entity;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: order_id },
      });

      if (payment && payment.status !== 'PAID') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            providerPaymentId: payment_id,
            status: 'PAID',
            rawResponse: payload,
          },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PAID' },
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Razorpay webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
