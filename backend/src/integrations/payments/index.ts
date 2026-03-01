import { PAYMENT_METHODS, PaymentMethodType } from '../../config/constants';
import logger from '../../utils/logger';

// Payment provider interface
export interface CreatePaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    name?: string;
    email?: string;
    phone: string;
  };
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  success: boolean;
  providerOrderId?: string;
  providerPaymentId?: string;
  paymentUrl?: string;
  amount?: number;
  currency?: string;
  keyId?: string; // For Razorpay client-side
  error?: string;
}

export interface VerifyPaymentRequest {
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string;
  rawResponse?: Record<string, unknown>;
}

export interface VerifyPaymentResponse {
  success: boolean;
  isValid: boolean;
  amount?: number;
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  status?: string;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  payload: Record<string, unknown>;
  signature: string;
  rawBody: string;
}

export interface WebhookResponse {
  success: boolean;
  event?: string;
  orderId?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
  error?: string;
}

export interface PaymentService {
  createPayment(data: CreatePaymentRequest): Promise<PaymentResponse>;
  verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse>;
  processRefund(data: RefundRequest): Promise<RefundResponse>;
  handleWebhook(payload: WebhookPayload): Promise<WebhookResponse>;
  getPaymentStatus(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }>;
}

// Provider registry
const providerRegistry: Record<string, () => Promise<unknown>> = {
  [PAYMENT_METHODS.RAZORPAY]: async () => {
    const { RazorpayService } = await import('./razorpay/razorpay.service');
    return new RazorpayService();
  },
  [PAYMENT_METHODS.STRIPE]: async () => {
    const { StripeService } = await import('./stripe/stripe.service');
    return new StripeService();
  },
};

/**
 * Get payment service for specified provider
 */
export async function getPaymentService(provider: PaymentMethodType): Promise<PaymentService> {
  const loader = providerRegistry[provider];

  if (!loader) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }

  try {
    return (await loader()) as PaymentService;
  } catch (error) {
    logger.error(`Failed to load payment service for ${provider}:`, error);
    throw new Error(`Failed to initialize payment service: ${provider}`);
  }
}

/**
 * Get available payment providers
 */
export function getAvailablePaymentProviders(): string[] {
  return Object.keys(providerRegistry);
}

/**
 * Check if provider is supported
 */
export function isPaymentProviderSupported(provider: string): boolean {
  return provider in providerRegistry;
}

/**
 * Check if payment method is online (not COD)
 */
export function isOnlinePayment(method: string): boolean {
  return method !== PAYMENT_METHODS.COD && isPaymentProviderSupported(method);
}

// Re-export types and constants
export { PAYMENT_METHODS };
export type { PaymentMethodType };
