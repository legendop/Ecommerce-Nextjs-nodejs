import { Router } from 'express';
import { authenticate, requireManager } from '../../middleware';
import * as controller from '../../modules/categories/controller';

const router = Router();

router.use(authenticate);
router.use(requireManager);

// List all categories
router.get('/', controller.listCategories);

// Create category
router.post('/', controller.createCategory);

// Get category
router.get('/:id', controller.getCategory);

// Update category
router.patch('/:id', controller.updateCategory);

// Delete category
router.delete('/:id', controller.deleteCategory);

export default router;
