import { SHIPPING_PROVIDERS, ShippingProviderType } from '../../config/constants';
import logger from '../../utils/logger';

// Shipping provider interface
export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ShipmentItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  weight?: number; // in grams
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  address: ShippingAddress;
  items: ShipmentItem[];
  totalWeight?: number; // in grams
  totalAmount: number;
  paymentMethod: string;
}

export interface ShipmentResponse {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  labelUrl?: string;
  estimatedDelivery?: Date;
  error?: string;
}

export interface TrackingResponse {
  success: boolean;
  trackingNumber: string;
  status?: string;
  currentLocation?: string;
  events?: Array<{
    date: Date;
    status: string;
    location?: string;
    description?: string;
  }>;
  estimatedDelivery?: Date;
  error?: string;
}

export interface ShippingService {
  createShipment(data: CreateShipmentRequest): Promise<ShipmentResponse>;
  trackShipment(trackingNumber: string): Promise<TrackingResponse>;
  cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }>;
  calculateShipping(data: {
    pincode: string;
    weight: number;
    dimensions?: { length: number; width: number; height: number };
  }): Promise<{ success: boolean; rate?: number; days?: number; error?: string; couriers?: unknown[] }>;
  // Optional extended methods
  generateAWB?(shipmentId: string, courierId?: number): Promise<ShipmentResponse>;
  downloadLabel?(shipmentIds: string[]): Promise<{ success: boolean; labelUrl?: string; error?: string }>;
  getCouriers?(): Promise<{ success: boolean; couriers?: unknown[]; error?: string }>;
}

// Provider registry
const providerRegistry: Record<string, () => Promise<ShippingService>> = {
  [SHIPPING_PROVIDERS.SHIPROCKET]: async () => {
    const { ShiprocketService } = await import('./shiprocket/shiprocket.service');
    return new ShiprocketService();
  },
};

/**
 * Get shipping service for specified provider
 */
export async function getShippingService(provider: ShippingProviderType): Promise<ShippingService> {
  const loader = providerRegistry[provider];

  if (!loader) {
    throw new Error(`Unsupported shipping provider: ${provider}`);
  }

  try {
    return await loader();
  } catch (error) {
    logger.error(`Failed to load shipping service for ${provider}:`, error);
    throw new Error(`Failed to initialize shipping service: ${provider}`);
  }
}

/**
 * Get available shipping providers
 */
export function getAvailableShippingProviders(): string[] {
  return Object.keys(providerRegistry);
}

/**
 * Check if provider is supported
 */
export function isShippingProviderSupported(provider: string): boolean {
  return provider in providerRegistry;
}

// Re-export types and constants
export { SHIPPING_PROVIDERS };
export type { ShippingProviderType };
