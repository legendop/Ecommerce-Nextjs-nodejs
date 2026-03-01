import { apiClient } from './api';

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Payment service
 * Handles all payment-related API calls
 */
export const paymentService = {
  /**
   * Create Razorpay order
   */
  createRazorpayOrder: async (orderId: string): Promise<RazorpayOrderResponse> => {
    const response = await apiClient.post<RazorpayOrderResponse>('/payments/razorpay/create', { orderId });
    return response.data.data as RazorpayOrderResponse;
  },

  /**
   * Verify Razorpay payment
   */
  verifyRazorpayPayment: async (data: VerifyPaymentRequest): Promise<{ orderId: string }> => {
    const response = await apiClient.post<{ orderId: string }>('/payments/razorpay/verify', data);
    return response.data.data as { orderId: string };
  },
};

export default paymentService;
