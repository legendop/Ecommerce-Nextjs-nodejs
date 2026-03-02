import { apiClient } from './api';

export interface Shipment {
  id: string;
  orderId: string;
  provider: string;
  trackingId?: string;
  trackingUrl?: string;
  shipmentStatus: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  provider: string;
  trackingId?: string;
  trackingUrl?: string;
  shipmentStatus?: string;
}

export interface UpdateShipmentStatusRequest {
  shipmentStatus: string;
  trackingId?: string;
  trackingUrl?: string;
}

interface ShipmentListResponse {
  data: Shipment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Shipments service
 * Handles all shipment-related API calls
 */
export const shipmentsService = {
  /**
   * Auth: Get shipments for an order
   */
  getOrderShipments: async (orderId: string): Promise<Shipment[]> => {
    const response = await apiClient.get<Shipment[]>(`/shipments/order/${orderId}`);
    return response.data.data as Shipment[];
  },

  /**
   * Admin: List all shipments
   */
  adminList: async (params?: { page?: number; limit?: number; orderId?: string }): Promise<ShipmentListResponse> => {
    const response = await apiClient.get<ShipmentListResponse>('/shipments/admin/all', params);
    return response.data.data as ShipmentListResponse;
  },

  /**
   * Admin: Get single shipment
   */
  adminGet: async (id: string): Promise<Shipment> => {
    const response = await apiClient.get<Shipment>(`/shipments/admin/${id}`);
    return response.data.data as Shipment;
  },

  /**
   * Admin: Create shipment
   */
  create: async (data: CreateShipmentRequest): Promise<Shipment> => {
    const response = await apiClient.post<Shipment>('/shipments/admin', data);
    return response.data.data as Shipment;
  },

  /**
   * Admin: Update shipment status
   */
  updateStatus: async (id: string, data: UpdateShipmentStatusRequest): Promise<Shipment> => {
    const response = await apiClient.patch<Shipment>(`/shipments/admin/${id}/status`, data);
    return response.data.data as Shipment;
  },

  /**
   * Admin: Delete shipment
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/shipments/admin/${id}`);
  },
};

export default shipmentsService;
