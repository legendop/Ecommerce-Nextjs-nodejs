import { apiClient } from './api';
import { User } from '@/types';

export interface UserWithDetails extends User {
  authMethods?: Array<{
    authType: string;
    identifier: string;
    isVerified: boolean;
  }>;
  addresses?: unknown[];
  _count?: {
    orders: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UserListResponse {
  data: UserWithDetails[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateUserRequest {
  role?: 'USER' | 'ADMIN' | 'MANAGER';
  isActive?: boolean;
  name?: string;
}

/**
 * Users service (Admin)
 * Handles all user management API calls for admins
 */
export const usersService = {
  /**
   * Admin: List all users
   */
  list: async (params?: { page?: number; limit?: number; role?: string }): Promise<UserListResponse> => {
    const response = await apiClient.get<UserListResponse>('/users', params);
    return response.data.data as UserListResponse;
  },

  /**
   * Admin: Get single user
   */
  get: async (id: string): Promise<UserWithDetails> => {
    const response = await apiClient.get<UserWithDetails>(`/users/${id}`);
    return response.data.data as UserWithDetails;
  },

  /**
   * Admin: Update user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<UserWithDetails> => {
    const response = await apiClient.patch<UserWithDetails>(`/users/${id}`, data);
    return response.data.data as UserWithDetails;
  },

  /**
   * Admin: Deactivate/delete user
   */
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * Admin: Update user role (via auth route)
   */
  updateRole: async (id: string, role: 'USER' | 'ADMIN' | 'MANAGER'): Promise<User> => {
    const response = await apiClient.patch<User>(`/auth/admin/users/${id}/role`, { role });
    return response.data.data as User;
  },

  /**
   * Admin: List users via auth route
   */
  listViaAuth: async (): Promise<UserWithDetails[]> => {
    const response = await apiClient.get<UserWithDetails[]>('/auth/admin/users');
    return response.data.data as UserWithDetails[];
  },
};

export default usersService;
