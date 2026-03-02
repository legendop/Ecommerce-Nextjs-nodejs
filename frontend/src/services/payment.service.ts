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
   * Create payment order
   */
  createPayment: async (orderId: string, provider: string = 'razorpay'): Promise<RazorpayOrderResponse> => {
    const response = await apiClient.post<RazorpayOrderResponse>('/payments/create', { orderId, provider });
    return response.data.data as RazorpayOrderResponse;
  },

  /**
   * Verify payment
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<{ orderId: string }> => {
    const response = await apiClient.post<{ orderId: string }>('/payments/verify', data);
    return response.data.data as { orderId: string };
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (paymentId: string): Promise<unknown> => {
    const response = await apiClient.get<unknown>(`/payments/${paymentId}/status`);
    return response.data.data;
  },
};

export default paymentService;
