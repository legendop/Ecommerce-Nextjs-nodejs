import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

// Create logger
const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        config.NODE_ENV === 'production' ? json() : devFormat
      ),
    }),
  ],
});

// Add file transports in production
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
    })
  );
}

// Export stream for morgan
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

export default logger;
