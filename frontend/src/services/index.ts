// Service exports
export { apiClient } from './api';
export type { default as api } from './api';
export { authService } from './auth.service';
export { productService } from './product.service';
export { cartService } from './cart.service';
export { orderService } from './order.service';
export { paymentService } from './payment.service';

// Re-export types
export type { CartItem, CartValidationResponse } from './cart.service';
export type { RazorpayOrderResponse, VerifyPaymentRequest } from './payment.service';
