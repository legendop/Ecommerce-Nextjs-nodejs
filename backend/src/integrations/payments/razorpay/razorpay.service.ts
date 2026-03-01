import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../../../config/env';
import logger from '../../../utils/logger';
import {
  PaymentService,
  CreatePaymentRequest,
  PaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookResponse,
} from '../index';

// Razorpay API Types
interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  offers: unknown[];
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: Record<string, unknown>;
  created_at: number;
}

interface RazorpayRefund {
  id: string;
  entity: string;
  payment_id: string;
  amount: number;
  currency: string;
  receipt?: string;
  notes: Record<string, string>;
  acquirer_data: Record<string, unknown>;
  created_at: number;
  batch_id: string | null;
  status: 'pending' | 'processed' | 'failed';
  speed_processed: string;
  speed_requested: string;
}

interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPayment;
    };
    order?: {
      entity: RazorpayOrder;
    };
    refund?: {
      entity: RazorpayRefund;
    };
  };
  created_at: number;
}

export class RazorpayService implements PaymentService {
  private client: Razorpay;

  constructor() {
    if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }

    this.client = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });

    logger.info('Razorpay service initialized');
  }

  /**
   * Create a new payment order
   * API: POST /v1/orders
   */
  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate required fields
      if (!data.amount || data.amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Convert amount to smallest currency unit (paise for INR)
      const amountInPaise = Math.round(data.amount * 100);

      const orderOptions = {
        amount: amountInPaise,
        currency: data.currency?.toUpperCase() || 'INR',
        receipt: data.orderNumber?.substring(0, 40), // Max 40 chars
        notes: {
          orderId: data.orderId,
          userId: data.customer.id,
          customerName: data.customer.name || '',
          customerPhone: data.customer.phone || '',
          description: data.description || '',
          ...data.metadata,
        },
        partial_payment: false,
      };

      logger.info('Creating Razorpay order:', {
        orderNumber: data.orderNumber,
        amount: amountInPaise,
        currency: orderOptions.currency,
      });

      const order = await this.client.orders.create(orderOptions);

      logger.info('Razorpay order created:', {
        orderId: order.id,
        status: order.status,
      });

      return {
        success: true,
        providerOrderId: order.id,
        amount: data.amount,
        currency: order.currency,
        keyId: config.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment order';
      logger.error('Razorpay create payment error:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify payment signature (for server-side verification)
   * Signature formula: HMAC_SHA256(orderId + "|" + paymentId, secret)
   */
  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      if (!data.signature || !data.providerOrderId || !data.providerPaymentId) {
        return {
          success: false,
          isValid: false,
          error: 'Missing required fields for verification',
        };
      }

      // Generate expected signature
      const body = `${data.providerOrderId}|${data.providerPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      // Compare signatures using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(data.signature, 'hex')
      );

      logger.info('Razorpay payment verification:', {
        orderId: data.providerOrderId,
        paymentId: data.providerPaymentId,
        isValid,
      });

      return {
        success: true,
        isValid,
      };
    } catch (error) {
      logger.error('Razorpay verify payment error:', error);
      return {
        success: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  /**
   * Capture an authorized payment
   * API: POST /v1/payments/{paymentId}/capture
   */
  async capturePayment(paymentId: string, amount: number): Promise<PaymentResponse> {
    try {
      const amountInPaise = Math.round(amount * 100);

      logger.info('Capturing Razorpay payment:', { paymentId, amount: amountInPaise });

      const payment = await this.client.payments.capture(
        paymentId,
        amountInPaise,
        'INR'
      );

      logger.info('Payment captured successfully:', {
        paymentId: payment.id,
        status: payment.status,
      });

      return {
        success: true,
        providerPaymentId: payment.id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency,
      };
    } catch (error) {
      logger.error('Razorpay capture payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture payment',
      };
    }
  }

  /**
   * Process refund (full or partial)
   * API: POST /v1/payments/{paymentId}/refund
   */
  async processRefund(data: RefundRequest): Promise<RefundResponse> {
    try {
      if (!data.paymentId) {
        throw new Error('Payment ID is required for refund');
      }

      // If amount specified, it's a partial refund
      const refundOptions: { amount?: number; speed?: 'normal' | 'optimum'; notes?: Record<string, string> } = {
        speed: 'normal',
        notes: {},
      };

      if (data.reason) {
        refundOptions.notes = { reason: data.reason };
      }

      if (data.amount) {
        refundOptions.amount = Math.round(data.amount * 100); // Convert to paise
      }

      logger.info('Processing Razorpay refund:', {
        paymentId: data.paymentId,
        amount: refundOptions.amount ? refundOptions.amount / 100 : 'full',
        reason: data.reason,
      });

      const refund = (await this.client.payments.refund(
        data.paymentId,
        refundOptions.amount ? { amount: refundOptions.amount, notes: refundOptions.notes } : { notes: refundOptions.notes }
      )) as unknown as RazorpayRefund;

      logger.info('Refund processed successfully:', {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
      };
    } catch (error) {
      logger.error('Razorpay refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  /**
   * Get payment details
   * API: GET /v1/payments/{paymentId}
   */
  async getPaymentDetails(paymentId: string): Promise<{ success: boolean; payment?: unknown; error?: string }> {
    try {
      const payment = (await this.client.payments.fetch(paymentId)) as RazorpayPayment;

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          orderId: payment.order_id,
          captured: payment.captured,
          amountRefunded: payment.amount_refunded / 100,
          refundStatus: payment.refund_status,
          email: payment.email,
          contact: payment.contact,
          createdAt: new Date(payment.created_at * 1000),
        },
      };
    } catch (error) {
      logger.error('Razorpay get payment details error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch payment details',
      };
    }
  }

  /**
   * Get order details
   * API: GET /v1/orders/{orderId}
   */
  async getOrderDetails(orderId: string): Promise<{ success: boolean; order?: unknown; payments?: unknown[]; error?: string }> {
    try {
      const order = await this.client.orders.fetch(orderId);

      // Fetch payments for this order
      const paymentsData = await this.client.orders.fetchPayments(orderId);
      const payments = Array.isArray(paymentsData.items) ? paymentsData.items : [];

      return {
        success: true,
        order: {
          id: order.id,
          amount: Number(order.amount) / 100,
          amountPaid: Number(order.amount_paid) / 100,
          amountDue: Number(order.amount_due) / 100,
          currency: order.currency,
          status: order.status,
          attempts: order.attempts,
          receipt: order.receipt,
          createdAt: new Date(order.created_at * 1000),
          notes: order.notes,
        },
        payments: payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount) / 100,
          status: p.status,
          method: p.method,
          captured: p.captured,
        })),
      };
    } catch (error) {
      logger.error('Razorpay get order details error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch order details',
      };
    }
  }

  /**
   * Handle webhook events
   * Verify signature: HMAC_SHA256(webhookBody, secret)
   */
  async handleWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
    try {
      // Verify webhook signature
      if (!config.RAZORPAY_WEBHOOK_SECRET) {
        logger.warn('Razorpay webhook secret not configured, skipping signature verification');
      } else {
        const expectedSignature = crypto
          .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
          .update(payload.rawBody)
          .digest('hex');

        if (payload.signature !== expectedSignature) {
          logger.error('Invalid webhook signature', {
            received: payload.signature,
            expected: expectedSignature,
          });
          return {
            success: false,
            error: 'Invalid signature',
          };
        }
      }

      const event = payload.payload as unknown as RazorpayWebhookEvent;

      logger.info('Processing Razorpay webhook:', {
        event: event.event,
        accountId: event.account_id,
      });

      switch (payload.event) {
        case 'payment.captured': {
          const payment = event.payload?.payment?.entity;
          if (!payment) {
            return { success: false, error: 'Invalid payload: missing payment entity' };
          }

          logger.info('Payment captured event:', {
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount / 100,
          });

          return {
            success: true,
            event: 'payment.captured',
            orderId: payment.order_id,
            paymentId: payment.id,
            amount: payment.amount / 100,
            status: 'PAID',
          };
        }

        case 'payment.failed': {
          const payment = event.payload?.payment?.entity;

          logger.warn('Payment failed event:', {
            paymentId: payment?.id,
            orderId: payment?.order_id,
            errorCode: payment?.error_code,
            errorDescription: payment?.error_description,
          });

          return {
            success: true,
            event: 'payment.failed',
            orderId: payment?.order_id,
            paymentId: payment?.id,
            status: 'FAILED',
          };
        }

        case 'refund.processed': {
          const refund = event.payload?.refund?.entity;

          logger.info('Refund processed event:', {
            refundId: refund?.id,
            paymentId: refund?.payment_id,
            amount: refund?.amount ? refund.amount / 100 : 0,
          });

          return {
            success: true,
            event: 'refund.processed',
            paymentId: refund?.payment_id,
            status: 'REFUNDED',
          };
        }

        case 'order.paid': {
          const order = event.payload?.order?.entity;

          logger.info('Order paid event:', {
            orderId: order?.id,
            amount: order?.amount ? order.amount / 100 : 0,
          });

          return {
            success: true,
            event: 'order.paid',
            orderId: order?.id,
            status: 'PAID',
          };
        }

        default:
          logger.info('Unhandled webhook event:', { event: payload.event });
          return {
            success: true,
            event: payload.event,
          };
      }
    } catch (error) {
      logger.error('Razorpay webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      };
    }
  }

  /**
   * Get payment status
   * API: GET /v1/payments/{paymentId}
   */
  async getPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const payment = (await this.client.payments.fetch(paymentId)) as RazorpayPayment;

      // Map Razorpay status to our status
      const statusMap: Record<string, string> = {
        'created': 'PENDING',
        'authorized': 'AUTHORIZED',
        'captured': 'PAID',
        'refunded': 'REFUNDED',
        'failed': 'FAILED',
      };

      return {
        success: true,
        status: statusMap[payment.status] || payment.status,
      };
    } catch (error) {
      logger.error('Razorpay get payment status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      };
    }
  }

  /**
   * Create a customer in Razorpay
   * API: POST /v1/customers
   */
  async createCustomer(data: {
    name: string;
    email?: string;
    contact?: string;
    notes?: Record<string, string>;
  }): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      const customer = await this.client.customers.create({
        name: data.name,
        email: data.email,
        contact: data.contact,
        notes: data.notes,
      });

      return {
        success: true,
        customerId: (customer as { id: string }).id,
      };
    } catch (error) {
      logger.error('Razorpay create customer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      };
    }
  }
}
