export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  role: 'USER' | 'ADMIN' | 'MANAGER';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
  _count?: {
    catalogs?: number;
  };
}

export interface ProductItem {
  id: string;
  catalogId: string;
  skuCode: string;
  size?: string;
  color?: string;
  price: number;
  discount?: number;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  shortDescription?: string;
  imageUrl?: string;
  isActive: boolean;
  categories?: Array<{
    categoryId: string;
    category: {
      name: string;
    };
  }>;
  items?: ProductItem[];
  // Flattened fields for UI (from first item)
  price?: number;
  stock?: number;
  sku?: string;
  categoryId?: string;
  category?: Category;
  images?: ProductImage[];
  // UI helpers
  compareAtPrice?: number | null;
  comparePrice?: number | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
  total: number;
}

export interface Address {
  id: string;
  userId: string;
  label?: string;
  name?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'COD' | 'RAZORPAY' | 'UPI' | 'CARD';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  addressId: string;
  address?: Address;
  subtotal: number;
  deliveryCharge: number;
  taxAmount: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  orderStatus: OrderStatus;
  deliveryEstimate?: string;
  distanceKm?: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface DeliveryCalculation {
  distance: number;
  deliveryCharge: number;
  estimate: string;
  isEligible: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  isActive: boolean;
}

export interface FormField {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'TEXTAREA' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'DATE' | 'FILE' | 'HIDDEN';
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  defaultValue?: string;
}

export interface Form {
  id: string;
  name: string;
  slug: string;
  description?: string;
  submitText?: string;
  successMessage?: string;
  fields: FormField[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  todayOrders: number;
  todayRevenue: number;
  totalVisits: number;
  todayVisits: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
  }>;
  orderStatusCounts: Record<string, number>;
}
