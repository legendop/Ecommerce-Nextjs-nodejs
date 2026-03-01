import { Router } from 'express';
import { authenticate, requireManager } from '../../middleware';
import * as controller from '../../modules/products/controller';

const router = Router();

router.use(authenticate);
router.use(requireManager);

// List all catalogs
router.get('/', controller.listCatalogs);

// Create catalog
router.post('/', controller.createCatalog);

// Get catalog
router.get('/:id', controller.getCatalog);

// Update catalog
router.patch('/:id', controller.updateCatalog);

// Delete catalog
router.delete('/:id', controller.deleteCatalog);

export default router;
