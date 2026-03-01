// ==========================================
// APPLICATION CONSTANTS
// ==========================================

export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
} as const;

export type RoleType = keyof typeof ROLES;

// ==========================================
// ORDER CONSTANTS
// ==========================================

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;

export type OrderStatusType = keyof typeof ORDER_STATUS;

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURNED],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.RETURNED]: [],
};

// ==========================================
// PAYMENT CONSTANTS
// ==========================================

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentStatusType = keyof typeof PAYMENT_STATUS;

export const PAYMENT_METHODS = {
  COD: 'COD',
  RAZORPAY: 'RAZORPAY',
  STRIPE: 'STRIPE',
  UPI: 'UPI',
} as const;

export type PaymentMethodType = keyof typeof PAYMENT_METHODS;

// ==========================================
// SHIPPING CONSTANTS
// ==========================================

export const SHIPPING_PROVIDERS = {
  SHIPROCKET: 'SHIPROCKET',
  DELHIVERY: 'DELHIVERY',
  ECOM_EXPRESS: 'ECOM_EXPRESS',
  INTERNAL: 'INTERNAL',
} as const;

export type ShippingProviderType = keyof typeof SHIPPING_PROVIDERS;

export const SHIPPING_STATUS = {
  NOT_SHIPPED: 'NOT_SHIPPED',
  READY_TO_SHIP: 'READY_TO_SHIP',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED_ATTEMPT: 'FAILED_ATTEMPT',
  RETURNED: 'RETURNED',
} as const;

// ==========================================
// DISCOUNT TYPES
// ==========================================

export const DISCOUNT_TYPES = {
  PERCENT: 'PERCENT',
  FLAT: 'FLAT',
} as const;

export type DiscountType = keyof typeof DISCOUNT_TYPES;

// ==========================================
// PAGINATION
// ==========================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ==========================================
// FILE UPLOAD
// ==========================================

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

// ==========================================
// OTP & AUTH
// ==========================================

export const AUTH = {
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 3,
  OTP_LENGTH: 6,
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  TOKEN_EXPIRES_IN: '7d',
} as const;

// ==========================================
// RATE LIMITING
// ==========================================

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  OTP_MAX_REQUESTS: 5,
} as const;

// ==========================================
// DELIVERY CALCULATION
// ==========================================

export const DELIVERY = {
  FREE_RADIUS_KM: 12,
  BASE_CHARGE: 60,
  EXTRA_CHARGE_PER_KM: 10,
  EARTH_RADIUS_KM: 6371,
} as const;

// ==========================================
// ERROR MESSAGES
// ==========================================

export const ERROR_MESSAGES = {
  // Auth
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_OTP: 'Invalid OTP',
  OTP_EXPIRED: 'OTP has expired',
  OTP_MAX_ATTEMPTS: 'Too many failed attempts. Request new OTP',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_INACTIVE: 'Account is deactivated',
  USER_EXISTS: 'User already exists',

  // Product
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
  INSUFFICIENT_STOCK: 'Insufficient stock available',

  // Order
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_CANNOT_CANCEL: 'Order cannot be cancelled at this stage',
  INVALID_ORDER_STATUS: 'Invalid order status transition',

  // Payment
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_NOT_FOUND: 'Payment record not found',

  // Coupon
  COUPON_INVALID: 'Invalid or expired coupon',
  COUPON_MIN_ORDER: 'Order amount does not meet minimum requirement',
  COUPON_USAGE_LIMIT: 'Coupon usage limit exceeded',

  // General
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request',
} as const;

// ==========================================
// SUCCESS MESSAGES
// ==========================================

export const SUCCESS_MESSAGES = {
  // Auth
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',

  // Order
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',

  // Payment
  PAYMENT_SUCCESS: 'Payment completed successfully',
  PAYMENT_INITIATED: 'Payment initiated',

  // General
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
} as const;
