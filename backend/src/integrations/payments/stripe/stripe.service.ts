import Stripe from 'stripe';
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

export class StripeService implements PaymentService {
  private client: Stripe;

  constructor() {
    if (!config.STRIPE_SECRET_KEY) {
      throw new Error('Stripe credentials not configured');
    }

    this.client = new Stripe(config.STRIPE_SECRET_KEY);
  }

  /**
   * Create a new payment intent
   */
  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency?.toLowerCase() || 'inr',
        metadata: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          userId: data.customer.id,
          ...data.metadata,
        },
        description: data.description || `Order ${data.orderNumber}`,
        receipt_email: data.customer.email,
      });

      return {
        success: true,
        providerOrderId: paymentIntent.id,
        paymentUrl: paymentIntent.client_secret || undefined,
        amount: data.amount,
        currency: paymentIntent.currency.toUpperCase(),
        keyId: config.STRIPE_PUBLISHABLE_KEY,
      };
    } catch (error) {
      logger.error('Stripe create payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  }

  /**
   * Verify payment - Stripe handles this via webhooks
   */
  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const paymentIntent = await this.client.paymentIntents.retrieve(data.providerPaymentId);

      return {
        success: true,
        isValid: paymentIntent.status === 'succeeded',
        amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
      };
    } catch (error) {
      logger.error('Stripe verify payment error:', error);
      return {
        success: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(data: RefundRequest): Promise<RefundResponse> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: data.paymentId,
      };

      if (data.amount) {
        refundData.amount = Math.round(data.amount * 100);
      }

      if (data.reason) {
        refundData.reason = this.mapRefundReason(data.reason);
      }

      const refund = await this.client.refunds.create(refundData);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status || undefined,
      };
    } catch (error) {
      logger.error('Stripe refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
    try {
      // Verify webhook signature
      const event = this.client.webhooks.constructEvent(
        payload.rawBody,
        payload.signature,
        config.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return {
            success: true,
            event: event.type,
            orderId: paymentIntent.metadata?.orderId,
            paymentId: paymentIntent.id,
            status: 'PAID',
            amount: paymentIntent.amount ? paymentIntent.amount / 100 : undefined,
          };
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          return {
            success: true,
            event: event.type,
            orderId: paymentIntent.metadata?.orderId,
            paymentId: paymentIntent.id,
            status: 'FAILED',
          };
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          return {
            success: true,
            event: event.type,
            paymentId: charge.payment_intent?.toString(),
            status: 'REFUNDED',
            amount: charge.amount_refunded ? charge.amount_refunded / 100 : undefined,
          };
        }

        default:
          return {
            success: true,
            event: event.type,
          };
      }
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);

      const statusMap: Record<string, string> = {
        requires_payment_method: 'PENDING',
        requires_confirmation: 'PENDING',
        requires_action: 'PENDING',
        processing: 'PENDING',
        requires_capture: 'PAID',
        canceled: 'FAILED',
        succeeded: 'PAID',
      };

      return {
        success: true,
        status: statusMap[paymentIntent.status] || paymentIntent.status.toUpperCase(),
      };
    } catch (error) {
      logger.error('Stripe get payment status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      };
    }
  }

  /**
   * Map refund reason to Stripe format
   */
  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    const reasonMap: Record<string, Stripe.RefundCreateParams.Reason> = {
      duplicate: 'duplicate',
      fraudulent: 'fraudulent',
      requested_by_customer: 'requested_by_customer',
    };

    return reasonMap[reason.toLowerCase()] || 'requested_by_customer';
  }
}
