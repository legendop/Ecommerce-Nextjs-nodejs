import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message = error.response?.data?.message || 'An error occurred';

    // Handle specific error codes
    if (error.response?.status === 401) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject({ ...error, message });
  }
);

// Auth API
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch('/auth/profile', data),
};

// Products API
export const productsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
    api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  adminList: (params?: { page?: number; limit?: number }) =>
    api.get('/products/admin/all', { params }),
  create: (data: unknown) => api.post('/products/admin', data),
  update: (id: string, data: unknown) => api.patch(`/products/admin/${id}`, data),
  delete: (id: string) => api.delete(`/products/admin/${id}`),
};

// Categories API
export const categoriesApi = {
  list: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  create: (data: unknown) => api.post('/categories/admin', data),
  update: (id: string, data: unknown) => api.patch(`/categories/admin/${id}`, data),
  delete: (id: string) => api.delete(`/categories/admin/${id}`),
};

// Cart API
export const cartApi = {
  validate: (items: Array<{ productId: string; quantity: number }>) =>
    api.post('/cart/validate', { items }),
};

// Addresses API
export const addressesApi = {
  list: () => api.get('/addresses'),
  get: (id: string) => api.get(`/addresses/${id}`),
  create: (data: unknown) => api.post('/addresses', data),
  update: (id: string, data: unknown) => api.patch(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
};

// Delivery API
export const deliveryApi = {
  check: (pincode: string) =>
    api.post('/delivery/check', { pincode }),
};

// Orders API
export const ordersApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/orders', { params }),
  get: (orderNumber: string) => api.get(`/orders/${orderNumber}`),
  create: (data: unknown) => api.post('/orders', data),
  adminList: (params?: unknown) => api.get('/orders/admin/all', { params }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/admin/${id}/status`, { status }),
};

// Payments API
export const paymentsApi = {
  createRazorpayOrder: (orderId: string) =>
    api.post('/payments/razorpay/create', { orderId }),
  verifyRazorpay: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/payments/razorpay/verify', data),
};

// Coupons API
export const couponsApi = {
  validate: (code: string, orderAmount: number) =>
    api.post('/coupons/validate', { code, orderAmount }),
  list: () => api.get('/coupons'),
  create: (data: unknown) => api.post('/coupons', data),
};

// Users API (Admin)
export const usersApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),
};

// Analytics API
export const analyticsApi = {
  recordVisit: (data?: { path?: string; referrer?: string }) =>
    api.post('/analytics/visit', data),
  getDashboard: () => api.get('/analytics/admin/dashboard'),
  getSalesChart: (days?: number) =>
    api.get('/analytics/admin/sales-chart', { params: { days } }),
};

// Forms API
export const formsApi = {
  get: (slug: string) => api.get(`/forms/${slug}`),
  submit: (slug: string, data: Record<string, unknown>) =>
    api.post(`/forms/${slug}/submit`, data),
};

// Settings API
export const settingsApi = {
  getPublic: () => api.get('/settings/public'),
  getAll: () => api.get('/settings'),
  update: (key: string, data: { value: string; type?: string; isPublic?: boolean; description?: string }) =>
    api.put(`/settings/${key}`, data),
  bulkUpdate: (settings: Record<string, { value: string; type?: string; isPublic?: boolean; description?: string }>) =>
    api.post('/settings/bulk', settings),
  delete: (key: string) => api.delete(`/settings/${key}`),
};

export default api;
