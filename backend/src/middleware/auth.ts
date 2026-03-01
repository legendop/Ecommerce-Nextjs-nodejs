import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { prisma } from '../config/prisma';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.userId) },
    });

    if (!user) {
      errorResponse(res, 'User not found', 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, 'Account is deactivated', 403);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    errorResponse(res, 'Invalid token', 401);
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(Role.ADMIN);
export const requireManager = requireRole(Role.ADMIN, Role.MANAGER);

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
