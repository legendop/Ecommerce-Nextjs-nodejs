import { apiClient } from './api';

export interface Listing {
  id: string;
  productId: string;
  skuCode?: string;
  size?: string;
  price: number;
  maxPrice?: number;
  discountPercent?: number;
  stock: number;
  reservedStock?: number;
  isActive: boolean;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: { imageUrl: string }[];
  };
}

export interface CreateListingRequest {
  productId: string;
  skuCode?: string;
  size?: string;
  price: number;
 Price?: number;
  discountPercent?: number;
  stock?: number;
  isActive?: boolean;
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  reservedStock?: number;
}

export interface StockUpdateRequest {
  stock: number;
}

export interface BulkStockUpdateRequest {
  updates: Array<{
    listingId: string;
    stock: number;
  }>;
}

interface ListingListResponse {
  data: Listing[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Listings service (Admin)
 * Handles all listing-related API calls for managers/admins
 */
export const listingsService = {
  /**
   * Admin: List all listings with filters
   */
  adminList: async (params?: { page?: number; limit?: number; productId?: string }): Promise<ListingListResponse> => {
    const response = await apiClient.get<ListingListResponse>('/listings/admin/all', params);
    return response.data.data as ListingListResponse;
  },

  /**
   * Admin: Get single listing by ID
   */
  adminGet: async (id: string): Promise<Listing> => {
    const response = await apiClient.get<Listing>(`/listings/admin/${id}`);
    return response.data.data as Listing;
  },

  /**
   * Public: Get single listing by ID
   */
  get: async (id: string): Promise<Listing> => {
    const response = await apiClient.get<Listing>(`/listings/${id}`);
    return response.data.data as Listing;
  },

  /**
   * Public: Get listings by product slug
   */
  getByProductSlug: async (slug: string): Promise<Listing[]> => {
    const response = await apiClient.get<Listing[]>(`/listings/product/${slug}`);
    return response.data.data as Listing[];
  },

  /**
   * Admin: Create new listing
   */
  create: async (data: CreateListingRequest): Promise<Listing> => {
    const response = await apiClient.post<Listing>('/listings/admin', data);
    return response.data.data as Listing;
  },

  /**
   * Admin: Update listing
   */
  update: async (id: string, data: UpdateListingRequest): Promise<Listing> => {
    const response = await apiClient.patch<Listing>(`/listings/admin/${id}`, data);
    return response.data.data as Listing;
  },

  /**
   * Admin: Update stock for a listing
   */
  updateStock: async (id: string, stock: number): Promise<Listing> => {
    const response = await apiClient.patch<Listing>(`/listings/admin/${id}/stock`, { stock });
    return response.data.data as Listing;
  },

  /**
   * Admin: Bulk update stock for multiple listings
   */
  bulkUpdateStock: async (updates: BulkStockUpdateRequest): Promise<void> => {
    await apiClient.post('/listings/admin/bulk-stock', updates);
  },

  /**
   * Admin: Toggle listing status (active/inactive)
   */
  toggleStatus: async (id: string): Promise<Listing> => {
    const response = await apiClient.patch<Listing>(`/listings/admin/${id}/toggle`);
    return response.data.data as Listing;
  },

  /**
   * Admin: Delete listing
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/listings/admin/${id}`);
  },
};

export default listingsService;
