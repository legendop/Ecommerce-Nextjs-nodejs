import { apiClient } from './api';
import { Address } from '@/types';

interface CreateAddressRequest {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

/**
 * Address service
 * Handles all address-related API calls
 */
export const addressService = {
  /**
   * List all addresses for current user
   */
  list: async (): Promise<Address[]> => {
    const response = await apiClient.get<Address[]>('/addresses');
    return response.data.data as Address[];
  },

  /**
   * Get single address by ID
   */
  get: async (id: string): Promise<Address> => {
    const response = await apiClient.get<Address>(`/addresses/${id}`);
    return response.data.data as Address;
  },

  /**
   * Create new address
   * Note: Backend expects 'name' field which maps to 'fullName'
   */
  create: async (data: CreateAddressRequest): Promise<Address> => {
    const response = await apiClient.post<Address>('/addresses', data);
    return response.data.data as Address;
  },

  /**
   * Update address
   */
  update: async (id: string, data: UpdateAddressRequest): Promise<Address> => {
    const response = await apiClient.patch<Address>(`/addresses/${id}`, data);
    return response.data.data as Address;
  },

  /**
   * Delete address
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },
};

export default addressService;
