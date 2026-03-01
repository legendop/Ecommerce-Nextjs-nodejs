import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  // App
  NODE_ENV: string;
  PORT: number;
  API_URL: string;
  FRONTEND_URL: string;

  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Cookies
  COOKIE_MAX_AGE: number;

  // OTP
  OTP_EXPIRY_MINUTES: number;

  // SMS (Twilio)
  SMS_PROVIDER: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;

  // Shipping Providers
  SHIPROCKET_EMAIL: string;
  SHIPROCKET_PASSWORD: string;
  SHIPROCKET_API_URL: string;

  DELHIVERY_API_KEY: string;
  DELHIVERY_API_URL: string;

  // Delivery
  WAREHOUSE_LAT: number;
  WAREHOUSE_LNG: number;
  FREE_RADIUS_KM: number;
  BASE_DELIVERY_CHARGE: number;
  EXTRA_CHARGE_PER_KM: number;

  // Storage
  STORAGE_TYPE: 'local' | 's3';
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;

  // Redis
  REDIS_URL: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  OTP_RATE_LIMIT_MAX: number;

  // Pagination
  DEFAULT_PAGE_SIZE: number;
  MAX_PAGE_SIZE: number;

  // Admin
  ADMIN_PHONE: string;
}

const config: Config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Cookies
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days

  // OTP
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),

  // SMS (Twilio)
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'twilio',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',

  // Shipping Providers
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || '',
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
  SHIPROCKET_API_URL: process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external',

  DELHIVERY_API_KEY: process.env.DELHIVERY_API_KEY || '',
  DELHIVERY_API_URL: process.env.DELHIVERY_API_URL || 'https://track.delhivery.com',

  // Delivery
  WAREHOUSE_LAT: parseFloat(process.env.WAREHOUSE_LAT || '22.5726'),
  WAREHOUSE_LNG: parseFloat(process.env.WAREHOUSE_LNG || '88.3639'),
  FREE_RADIUS_KM: parseFloat(process.env.FREE_RADIUS_KM || '12'),
  BASE_DELIVERY_CHARGE: parseFloat(process.env.BASE_DELIVERY_CHARGE || '60'),
  EXTRA_CHARGE_PER_KM: parseFloat(process.env.EXTRA_CHARGE_PER_KM || '10'),

  // Storage
  STORAGE_TYPE: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

  // Redis
  REDIS_URL: process.env.REDIS_URL || '',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 1000,
  OTP_RATE_LIMIT_MAX: 50,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Admin
  ADMIN_PHONE: process.env.ADMIN_PHONE || '9876543210',
};

// Validation
export function validateConfig(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'];

  for (const key of required) {
    if (!config[key as keyof Config]) {
      console.warn(`⚠️  ${key} is not set`);
    }
  }
}

export default config;
