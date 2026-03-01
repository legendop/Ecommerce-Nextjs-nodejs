import axios, { AxiosInstance } from 'axios';
import config from '../../../config/env';
import logger from '../../../utils/logger';
import {
  ShippingService,
  CreateShipmentRequest,
  ShipmentResponse,
  TrackingResponse,
} from '../index';

interface ShiprocketToken {
  token: string;
  expiresAt: number;
}

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
}

interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'COD' | 'Prepaid';
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ShiprocketService implements ShippingService {
  private client: AxiosInstance;
  private token: ShiprocketToken | null = null;
  private tokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.SHIPROCKET_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (requestConfig) => {
        const token = await this.getAuthToken();
        requestConfig.headers.Authorization = `Bearer ${token}`;
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear and retry
          this.token = null;
          this.tokenPromise = null;
          logger.warn('Shiprocket token expired, refreshing...');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get or refresh auth token with locking to prevent multiple simultaneous auth requests
   */
  private async getAuthToken(): Promise<string> {
    // Return existing token if valid
    if (this.token && this.token.expiresAt > Date.now()) {
      return this.token.token;
    }

    // If there's already an auth request in progress, wait for it
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Create new auth request
    this.tokenPromise = this.authenticate();

    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Authenticate with Shiprocket API
   */
  private async authenticate(): Promise<string> {
    try {
      logger.info('Authenticating with Shiprocket API...');

      const response = await axios.post(
        `${config.SHIPROCKET_API_URL}/auth/login`,
        {
          email: config.SHIPROCKET_EMAIL,
          password: config.SHIPROCKET_PASSWORD,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (!response.data?.token) {
        throw new Error('No token received from Shiprocket');
      }

      this.token = {
        token: response.data.token,
        expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000, // 9 days (token valid for 10)
      };

      logger.info('Shiprocket authentication successful');
      return this.token.token;
    } catch (error) {
      this.token = null;

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error('Shiprocket auth failed:', {
          status: error.response?.status,
          message: errorMessage,
        });
        throw new Error(`Shiprocket authentication failed: ${errorMessage}`);
      }

      logger.error('Shiprocket auth failed:', error);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  /**
   * Create a new shipment/order with Shiprocket
   * API: POST /v1/external/orders/create/adhoc
   */
  async createShipment(data: CreateShipmentRequest): Promise<ShipmentResponse> {
    try {
      // Validate required credentials
      if (!config.SHIPROCKET_EMAIL || !config.SHIPROCKET_PASSWORD) {
        throw new Error('Shiprocket credentials not configured');
      }

      // Calculate total weight (default 500g per item if not specified)
      const totalWeightGrams = data.totalWeight ||
        data.items.reduce((sum, item) => sum + (item.weight || 500) * item.quantity, 0);

      const totalWeightKg = Math.max(totalWeightGrams / 1000, 0.5); // Minimum 0.5kg

      // Build order payload according to Shiprocket API spec
      const payload: ShiprocketOrderPayload = {
        order_id: data.orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary', // Should be configured in Shiprocket dashboard
        billing_customer_name: data.address.fullName.split(' ')[0] || data.address.fullName,
        billing_last_name: data.address.fullName.split(' ').slice(1).join(' ') || '',
        billing_address: data.address.line1,
        billing_address_2: data.address.line2 || '',
        billing_city: data.address.city,
        billing_pincode: data.address.pincode,
        billing_state: data.address.state,
        billing_country: data.address.country || 'India',
        billing_email: 'customer@example.com', // Required field - should be collected from user
        billing_phone: data.address.phone,
        shipping_is_billing: true,
        order_items: data.items.map((item) => ({
          name: item.name.substring(0, 100), // Max 100 chars
          sku: item.sku || 'SKU-N/A',
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
        })),
        payment_method: data.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: data.totalAmount,
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        length: 20,
        breadth: 15,
        height: 10,
        weight: totalWeightKg,
      };

      logger.info('Creating Shiprocket order:', { orderId: data.orderNumber });

      const response = await this.client.post('/orders/create/adhoc', payload);

      if (response.data?.order_id) {
        logger.info('Shiprocket order created successfully:', {
          orderId: response.data.order_id,
          shipmentId: response.data.shipment_id,
        });

        return {
          success: true,
          shipmentId: response.data.shipment_id?.toString() || response.data.order_id?.toString(),
          trackingNumber: response.data.awb_code || null,
          courierName: response.data.courier_name || null,
          trackingUrl: response.data.awb_code
            ? `https://track.shiprocket.co/awb/${response.data.awb_code}`
            : undefined,
        };
      }

      throw new Error(response.data?.message || 'Failed to create shipment');
    } catch (error) {
      return this.handleError(error, 'createShipment');
    }
  }

  /**
   * Generate AWB (Air Waybill) for an order
   * API: POST /v1/external/courier/assign/awb
   */
  async generateAWB(shipmentId: string, courierId?: number): Promise<ShipmentResponse> {
    try {
      const payload: Record<string, unknown> = {
        shipment_id: parseInt(shipmentId, 10),
      };

      if (courierId) {
        payload.courier_id = courierId;
      }

      logger.info('Generating AWB for shipment:', { shipmentId });

      const response = await this.client.post('/courier/assign/awb', payload);

      if (response.data?.awb_assign_status === 1 && response.data?.response?.data?.awb_code) {
        const awbData = response.data.response.data;

        logger.info('AWB generated successfully:', {
          awb: awbData.awb_code,
          courier: awbData.courier_name,
        });

        return {
          success: true,
          shipmentId,
          trackingNumber: awbData.awb_code,
          courierName: awbData.courier_name,
          trackingUrl: `https://track.shiprocket.co/awb/${awbData.awb_code}`,
          labelUrl: awbData.label_url,
        };
      }

      throw new Error(response.data?.message || 'Failed to generate AWB');
    } catch (error) {
      return this.handleError(error, 'generateAWB');
    }
  }

  /**
   * Track shipment by AWB number
   * API: GET /v1/external/courier/track/awb/{awb}
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      logger.info('Tracking shipment:', { awb: trackingNumber });

      const response = await this.client.get(`/courier/track/awb/${trackingNumber}`);

      const trackingData = response.data;

      if (!trackingData || !trackingData.tracking_data) {
        throw new Error('Invalid tracking response from Shiprocket');
      }

      const shipmentTrack = trackingData.tracking_data.shipment_track?.[0] || {};
      const activities = trackingData.tracking_data.shipment_track_activities || [];

      return {
        success: true,
        trackingNumber,
        status: this.mapStatus(shipmentTrack.current_status),
        currentLocation: shipmentTrack.current_location || shipmentTrack.destination || '',
        estimatedDelivery: shipmentTrack.edd
          ? new Date(shipmentTrack.edd)
          : undefined,
        events: activities.map((activity: Record<string, unknown>) => ({
          date: activity.date ? new Date(activity.date as string) : new Date(),
          status: (activity.status as string) || '',
          location: (activity.location as string) || '',
          description: (activity.activity as string) || '',
        })),
      };
    } catch (error) {
      return this.handleTrackingError(error, trackingNumber);
    }
  }

  /**
   * Cancel a shipment/order
   * API: POST /v1/external/orders/cancel
   */
  async cancelShipment(shipmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Cancelling Shiprocket shipment:', { shipmentId });

      const response = await this.client.post('/orders/cancel', {
        ids: [parseInt(shipmentId, 10)],
      });

      // Shiprocket returns different response structures
      const isSuccess =
        response.data?.status_code === 1 ||
        response.status === 200 ||
        (Array.isArray(response.data) && response.data.length > 0);

      if (isSuccess) {
        logger.info('Shipment cancelled successfully:', { shipmentId });
        return { success: true };
      }

      throw new Error(response.data?.message || 'Failed to cancel shipment');
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('Shiprocket cancel shipment error:', { shipmentId, error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Calculate shipping rate and check serviceability
   * API: GET /v1/external/courier/serviceability/
   */
  async calculateShipping(data: {
    pincode: string;
    weight: number;
    dimensions?: { length: number; width: number; height: number };
  }): Promise<{ success: boolean; rate?: number; days?: number; error?: string; couriers?: unknown[] }> {
    try {
      // Get pickup pincode from config or use default
      const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '700001';

      const weightKg = Math.max(data.weight / 1000, 0.5); // Convert to kg, min 0.5kg

      logger.info('Calculating shipping rate:', {
        from: pickupPincode,
        to: data.pincode,
        weight: weightKg,
      });

      const response = await this.client.get('/courier/serviceability/', {
        params: {
          pickup_postcode: pickupPincode,
          delivery_postcode: data.pincode,
          weight: weightKg,
          cod: 0, // Check for prepaid first
        },
      });

      const availableCouriers = response.data?.data?.available_courier_companies;

      if (!Array.isArray(availableCouriers) || availableCouriers.length === 0) {
        return {
          success: false,
          error: 'No courier service available for this route',
        };
      }

      // Sort by rate and get cheapest
      const sortedCouriers = availableCouriers.sort(
        (a: { rate: number }, b: { rate: number }) => a.rate - b.rate
      );

      const cheapest = sortedCouriers[0];

      return {
        success: true,
        rate: cheapest.rate,
        days: parseInt(cheapest.etd) || 3,
        couriers: sortedCouriers.slice(0, 3), // Return top 3 options
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('Shiprocket calculate shipping error:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all couriers
   * API: GET /v1/external/courier/courierListWithCounts
   */
  async getCouriers(): Promise<{ success: boolean; couriers?: unknown[]; error?: string }> {
    try {
      const response = await this.client.get('/courier/courierListWithCounts');

      return {
        success: true,
        couriers: response.data?.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Download shipping label
   * API: POST /v1/external/courier/generate/label
   */
  async downloadLabel(shipmentIds: string[]): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    try {
      const response = await this.client.post('/courier/generate/label', {
        shipment_id: shipmentIds.map((id) => parseInt(id, 10)),
      });

      if (response.data?.label_url) {
        return {
          success: true,
          labelUrl: response.data.label_url,
        };
      }

      throw new Error('Failed to generate label');
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Map Shiprocket status to our standard status
   */
  private mapStatus(shiprocketStatus?: string): string {
    if (!shiprocketStatus) return 'UNKNOWN';

    const statusMap: Record<string, string> = {
      'PICKUP SCHEDULED': 'PICKED_UP',
      'PICKED UP': 'PICKED_UP',
      'IN TRANSIT': 'IN_TRANSIT',
      'OUT FOR DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'CANCELLED': 'CANCELLED',
      'RTO INITIATED': 'RETURNED',
      'RTO DELIVERED': 'RETURNED',
      'FAILED': 'FAILED_ATTEMPT',
    };

    return statusMap[shiprocketStatus.toUpperCase()] || shiprocketStatus;
  }

  /**
   * Handle errors and return standardized response
   */
  private handleError(error: unknown, operation: string): ShipmentResponse {
    const errorMessage = this.extractErrorMessage(error);
    logger.error(`Shiprocket ${operation} error:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Handle tracking errors
   */
  private handleTrackingError(error: unknown, trackingNumber: string): TrackingResponse {
    const errorMessage = this.extractErrorMessage(error);
    logger.error('Shiprocket track shipment error:', { trackingNumber, error: errorMessage });

    return {
      success: false,
      trackingNumber,
      error: errorMessage,
    };
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as ShiprocketErrorResponse;
      return data?.message || data?.errors?.[Object.keys(data.errors)[0]]?.[0] || error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }
}
