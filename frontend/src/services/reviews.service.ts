import { apiClient } from './api';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateReviewRequest {
  productId: number;
  orderId: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

interface ReviewListResponse {
  reviews: Review[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    average: number;
    total: number;
    distribution: Record<string, number>;
  };
}

/**
 * Reviews service
 * Handles all review-related API calls
 */
export const reviewsService = {
  /**
   * Public: Get product reviews
   */
  getProductReviews: async (productId: string, params?: { page?: number; limit?: number }): Promise<ReviewListResponse> => {
    const response = await apiClient.get<ReviewListResponse>(`/reviews/product/${productId}`, params);
    return response.data.data as ReviewListResponse;
  },

  /**
   * Auth: Get my reviews
   */
  getMyReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/reviews/my-reviews');
    return response.data.data as Review[];
  },

  /**
   * Public: Mark review as helpful
   */
  markHelpful: async (id: string): Promise<void> => {
    await apiClient.post(`/reviews/${id}/helpful`);
  },

  /**
   * Auth: Create review
   */
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews', data);
    return response.data.data as Review;
  },

  /**
   * Auth: Update review
   */
  update: async (id: string, data: UpdateReviewRequest): Promise<Review> => {
    const response = await apiClient.patch<Review>(`/reviews/${id}`, data);
    return response.data.data as Review;
  },

  /**
   * Auth: Delete review
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reviews/${id}`);
  },

  /**
   * Admin: List all reviews
   */
  adminList: async (params?: { page?: number; limit?: number; verified?: boolean }): Promise<ReviewListResponse> => {
    const response = await apiClient.get<ReviewListResponse>('/reviews/admin/all', params);
    return response.data.data as ReviewListResponse;
  },

  /**
   * Admin: Get single review
   */
  adminGet: async (id: string): Promise<Review> => {
    const response = await apiClient.get<Review>(`/reviews/admin/${id}`);
    return response.data.data as Review;
  },

  /**
   * Admin: Verify review
   */
  adminVerify: async (id: string): Promise<Review> => {
    const response = await apiClient.patch<Review>(`/reviews/admin/${id}/verify`);
    return response.data.data as Review;
  },

  /**
   * Admin: Delete review
   */
  adminDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reviews/admin/${id}`);
  },
};

export default reviewsService;
