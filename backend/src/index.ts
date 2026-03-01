import { createApp } from './app';
import { prisma } from './config/prisma';
import config from './config/env';
import logger from './utils/logger';

/**
 * Application entry point
 */
async function bootstrap(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`📚 API docs: http://localhost:${config.PORT}/api/v1/health`);
      logger.info(`🌐 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed');
        void prisma.$disconnect().then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Force shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    void prisma.$disconnect().then(() => process.exit(1));
  }
}

// Start the application
void bootstrap();
