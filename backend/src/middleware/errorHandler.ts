import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { errorResponse } from '../utils/response';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errors?: unknown[];
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        errorResponse(res, 'A record with this value already exists', 409);
        return;
      case 'P2025':
        errorResponse(res, 'Record not found', 404);
        return;
      case 'P2003':
        errorResponse(res, 'Related record not found', 400);
        return;
      default:
        errorResponse(res, 'Database error', 500);
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    errorResponse(res, 'Invalid data provided', 400);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse(res, 'Token expired', 401);
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  errorResponse(res, message, statusCode, err);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
