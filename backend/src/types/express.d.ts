import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId: string;
      startTime: number;
    }
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface CartItemInput {
  listingId: bigint;
  quantity: number;
}

export interface ValidatedCartItem {
  listingId: bigint;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  total: number;
}

export interface DeliveryCalculation {
  distance: number;
  deliveryCharge: number;
  estimate: string;
  isEligible: boolean;
}
