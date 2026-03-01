import { Router } from 'express';
import dashboardRoutes from './dashboard/routes';
import productRoutes from './products/routes';
import orderRoutes from './orders/routes';
import userRoutes from './users/routes';
import catalogRoutes from './catalogs/routes';
import categoryRoutes from './categories/routes';
import analyticsRoutes from './analytics/routes';

const router = Router();

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Products
router.use('/products', productRoutes);

// Orders
router.use('/orders', orderRoutes);

// Users
router.use('/users', userRoutes);

// Catalogs
router.use('/catalogs', catalogRoutes);

// Categories
router.use('/categories', categoryRoutes);

// Analytics
router.use('/analytics', analyticsRoutes);

export default router;
