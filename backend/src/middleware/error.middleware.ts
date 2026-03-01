import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorResponse } from '../utils/response';
import { ERROR_MESSAGES } from '../config/constants';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Prisma error codes mapping
 */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Record already exists' },
  P2003: { status: 400, message: 'Related record not found' },
  P2025: { status: 404, message: 'Record not found' },
  P2014: { status: 400, message: 'Invalid relation' },
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = ERROR_MESSAGES.INTERNAL_ERROR;
  let errorDetails: unknown = undefined;

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message as typeof ERROR_MESSAGES.INTERNAL_ERROR;
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: Record<string, unknown> };
    const mapped = PRISMA_ERROR_MAP[prismaError.code];
    if (mapped) {
      statusCode = mapped.status;
      message = mapped.message as typeof ERROR_MESSAGES.INTERNAL_ERROR;
      errorDetails = prismaError.meta;
    }
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message as typeof ERROR_MESSAGES.INTERNAL_ERROR;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = ERROR_MESSAGES.INVALID_TOKEN as typeof ERROR_MESSAGES.INTERNAL_ERROR;
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired' as typeof ERROR_MESSAGES.INTERNAL_ERROR;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      error: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    logger.warn('Client Error:', {
      error: err.message,
      statusCode,
    });
  }

  // Send response
  errorResponse(res, message, statusCode, errorDetails);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  errorResponse(res, ERROR_MESSAGES.NOT_FOUND, 404);
};

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
