import { apiClient } from './api';

export interface DeliveryCheckResponse {
  available: boolean;
  message: string;
  estimatedDays?: string;
}

export interface DeliverySettings {
  defaultProvider?: string;
  freeDeliveryThreshold?: number;
  deliveryCharge?: number;
  defaultPincode?: string;
}

export interface ShipmentDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface TrackingInfo {
  status: string;
  location?: string;
  timestamp?: string;
  message?: string;
}

/**
 * Delivery service
 * Handles delivery-related API calls
 */
export const deliveryService = {
  /**
   * Public: Check delivery availability for a pincode
   */
  check: async (pincode: string): Promise<DeliveryCheckResponse> => {
    const response = await apiClient.post<DeliveryCheckResponse>('/delivery/check', { pincode });
    return response.data.data as DeliveryCheckResponse;
  },

  /**
   * Admin: Get delivery settings
   */
  getSettings: async (): Promise<DeliverySettings> => {
    const response = await apiClient.get<DeliverySettings>('/delivery/settings');
    return response.data.data as DeliverySettings;
  },

  /**
   * Admin: Update delivery settings
   */
  updateSettings: async (data: DeliverySettings): Promise<DeliverySettings> => {
    const response = await apiClient.patch<DeliverySettings>('/delivery/settings', data);
    return response.data.data as DeliverySettings;
  },

  /**
   * Admin: Create shipment for order
   */
  createShipment: async (orderId: string, data: { provider?: string; dimensions?: ShipmentDimensions }): Promise<unknown> => {
    const response = await apiClient.post(`/delivery/shipments/${orderId}`, data);
    return response.data.data;
  },

  /**
   * Admin: Track shipment
   */
  trackShipment: async (orderId: string): Promise<TrackingInfo[]> => {
    const response = await apiClient.get<TrackingInfo[]>(`/delivery/shipments/${orderId}/track`);
    return response.data.data as TrackingInfo[];
  },
};

export default deliveryService;
