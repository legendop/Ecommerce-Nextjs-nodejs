import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware';
import * as controller from '../../modules/products/controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// List all products
router.get('/', controller.adminListProducts);

// Create product
router.post('/', controller.createProduct);

// Get product
router.get('/:id', controller.getProduct);

// Update product
router.patch('/:id', controller.updateProduct);

// Delete product
router.delete('/:id', controller.deleteProduct);

// Toggle product status
router.patch('/:id/toggle', controller.toggleProductStatus);

export default router;
