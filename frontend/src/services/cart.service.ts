import { apiClient } from './api';

export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CartValidationResponse {
  valid: boolean;
  items: Array<{
    itemId: string;
    available: boolean;
    stock: number;
    requested: number;
    price: number;
  }>;
  total: number;
}

/**
 * Cart service
 * Handles all cart-related API calls
 */
export const cartService = {
  /**
   * Validate cart items
   */
  validateCart: async (items: CartItem[]): Promise<CartValidationResponse> => {
    const response = await apiClient.post<CartValidationResponse>('/cart/validate', { items });
    return response.data.data as CartValidationResponse;
  },
};

export default cartService;
