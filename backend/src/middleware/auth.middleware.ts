import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { prisma } from '../config/prisma';
import { ERROR_MESSAGES } from '../config/constants';

/**
 * Authenticate middleware - verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, 401);
      return;
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.userId) },
    });

    if (!user) {
      errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, ERROR_MESSAGES.USER_INACTIVE, 403);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, 401);
  }
};

/**
 * Require specific roles middleware factory
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, ERROR_MESSAGES.FORBIDDEN, 403);
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * Manager or Admin middleware
 */
export const requireManager = requireRole(Role.ADMIN, Role.MANAGER);

/**
 * Optional authentication - attaches user if token valid, continues regardless
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.userId) },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Continue without user
    next();
  }
};
