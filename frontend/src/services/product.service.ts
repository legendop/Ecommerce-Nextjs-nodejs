import { apiClient } from './api';
import { Product, Category } from '@/types';

interface ProductListParams extends Record<string, unknown> {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  min?: number;
  max?: number;
}

interface ProductListResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Product service
 * Handles all product-related API calls
 */
export const productService = {
  /**
   * Get list of products
   */
  getProducts: async (params?: ProductListParams): Promise<ProductListResponse> => {
    const response = await apiClient.get<ProductListResponse>('/products', params);
    return response.data.data as ProductListResponse;
  },

  /**
   * Get product by slug
   */
  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/details/${slug}`);
    return response.data.data as Product;
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data.data as Category[];
  },

  /**
   * Get category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${slug}`);
    return response.data.data as Category;
  },
};

export default productService;
