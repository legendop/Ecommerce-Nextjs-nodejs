// Middleware exports
export { authenticate, requireRole, requireAdmin, requireManager, optionalAuth } from './auth.middleware';
export { errorHandler, notFoundHandler, AppError } from './error.middleware';
export { validate } from './validate.middleware';
export { apiLimiter, loginLimiter, otpLimiter, paymentLimiter } from './rateLimiter';
export { requestId, requestLogger } from './requestLogger';

// Role-based middleware helpers
import { requireRole } from './auth.middleware';
import { Role } from '@prisma/client';

export const roleMiddleware = (roles: Role[]) => requireRole(...roles);
