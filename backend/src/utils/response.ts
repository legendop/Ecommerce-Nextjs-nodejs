import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/express';

// Helper to convert BigInt to string and Decimal to number recursively
const serializeData = (obj: unknown): unknown => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  // Handle Prisma Decimal objects (they have d, e, s properties)
  if (typeof obj === 'object' && obj !== null && 'd' in obj && 'e' in obj && 's' in obj) {
    return Number(obj);
  }
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(serializeData);
    }
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = serializeData(value);
    }
    return converted;
  }
  return obj;
};

export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data: serializeData(data) as T,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
): Response => {
  const response: ApiResponse<T[]> & { meta: PaginationMeta } = {
    success: true,
    data: serializeData(data) as T[],
    meta,
  };

  if (message) {
    response.message = message;
  }

  return res.status(200).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: unknown
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error instanceof Error ? error.message : String(error);
  }

  return res.status(statusCode).json(response);
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response => {
  return successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

// Pagination helper
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
