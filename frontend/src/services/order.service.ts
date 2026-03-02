import { apiClient } from './api';
import { Order } from '@/types';

interface OrderListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
}

interface OrderListResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateOrderRequest {
  addressId: string;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  paymentMethod: string;
  couponCode?: string;
  deliveryCharge?: number;
}

/**
 * Order service
 * Handles all order-related API calls
 */
export const orderService = {
  /**
   * Get user's orders
   */
  getOrders: async (params?: OrderListParams): Promise<OrderListResponse> => {
    const response = await apiClient.get<OrderListResponse>('/orders/my', params);
    return response.data.data as OrderListResponse;
  },

  /**
   * Get order by order number
   */
  getOrder: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${orderNumber}`);
    return response.data.data as Order;
  },

  /**
   * Create new order
   */
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data.data as Order;
  },

  /**
   * Admin: Get all orders
   */
  adminGetOrders: async (params?: Record<string, unknown>): Promise<OrderListResponse> => {
    const response = await apiClient.get<OrderListResponse>('/orders/admin/all', params);
    return response.data.data as OrderListResponse;
  },

  /**
   * Admin: Update order status
   */
  adminUpdateStatus: async (id: string, status: string): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/admin/${id}/status`, { orderStatus: status });
    return response.data.data as Order;
  },
};

export default orderService;
