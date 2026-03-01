import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching for GET requests
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
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
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied:', message);
    }

    return Promise.reject({
      ...error,
      message,
      status: error.response?.status,
    });
  }
);

// Generic API methods
export const apiClient = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<T>>(url, { params }),

  post: <T>(url: string, data?: unknown) =>
    api.post<ApiResponse<T>>(url, data),

  patch: <T>(url: string, data?: unknown) =>
    api.patch<ApiResponse<T>>(url, data),

  put: <T>(url: string, data?: unknown) =>
    api.put<ApiResponse<T>>(url, data),

  delete: <T>(url: string) =>
    api.delete<ApiResponse<T>>(url),
};

export default api;
export { api };
