import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import config from './config';
import { stream } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { apiLimiter } from './middleware/rateLimiter';
import { requestId, requestLogger } from './middleware/requestLogger';

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
  const app = express();

  // Trust proxy (for getting client IP behind reverse proxy)
  app.set('trust proxy', 1);

  // ==========================================
  // SECURITY MIDDLEWARE
  // ==========================================
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.FRONTEND_URL],
      },
    },
  }));

  // CORS
  app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // ==========================================
  // REQUEST MIDDLEWARE
  // ==========================================
  app.use(requestId);
  app.use(requestLogger);
  app.use(morgan('combined', { stream }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

  // Rate limiting
  app.use(apiLimiter);

  // ==========================================
  // STATIC FILES
  // ==========================================
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // ==========================================
  // API ROUTES
  // ==========================================
  app.use('/api/v1', routes);

  // API 404 handler (for /api/* routes)
  app.use('/api', notFoundHandler);

  // ==========================================
  // ERROR HANDLING
  // ==========================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
