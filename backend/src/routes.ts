import { Router } from 'express';
import { authenticate } from './middleware';

// Public routes
import authRoutes from './modules/auth/routes';
import productRoutes from './modules/products/routes';
import categoryRoutes from './modules/categories/routes';
import listingRoutes from './modules/listings/routes';
import cartRoutes from './modules/cart/routes';
import reviewRoutes from './modules/reviews/routes';
import shipmentRoutes from './modules/shipments/routes';
import formRoutes from './modules/forms/routes';
import analyticsRoutes from './modules/analytics/routes';

// Protected user routes
import addressRoutes from './modules/addresses/routes';
import orderRoutes from './modules/orders/routes';
import couponRoutes from './modules/coupons/routes';
import deliveryRoutes from './modules/delivery/routes';
import paymentRoutes from './modules/payments/routes';
import settingsRoutes from './modules/settings/routes';
import userRoutes from './modules/users/routes';

const router = Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Public product browsing
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/listings', listingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/forms', formRoutes);

// Cart (can work with or without auth)
router.use('/cart', cartRoutes);

// Delivery check
router.use('/delivery', deliveryRoutes);
router.use('/settings', settingsRoutes);

// Analytics (public visit tracking + protected admin routes)
router.use('/analytics', analyticsRoutes);

// ==========================================
// PROTECTED USER ROUTES (Authentication required)
// ==========================================

router.use('/addresses', authenticate, addressRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/coupons', authenticate, couponRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);

export default router;
