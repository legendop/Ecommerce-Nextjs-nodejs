import api, { apiClient } from './api';
import { User } from '@/types';

interface AuthResponse {
  user: User;
}

interface OtpResponse {
  message: string;
}

/**
 * Authentication service
 * Handles all auth-related API calls
 */
export const authService = {
  /**
   * Send OTP to phone number
   */
  sendOtp: async (phone: string): Promise<OtpResponse> => {
    const response = await apiClient.post<OtpResponse>('/auth/send-otp', { phone });
    return response.data.data as OtpResponse;
  },

  /**
   * Verify OTP and login
   */
  verifyOtp: async (phone: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { phone, otp });
    return response.data.data as AuthResponse;
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data.data as User;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/profile', data);
    return response.data.data as User;
  },
};

export default authService;
