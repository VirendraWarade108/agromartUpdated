import { Router } from 'express';
import * as productController from '../controllers/productController';
import { validate } from '../middleware/validation';
import * as productValidators from '../validators/product';

const router = Router();

// Replace existing routes with validated versions:
router.get('/search', validate(productValidators.searchProductsSchema), productController.searchProducts);
router.get('/', validate(productValidators.getAllProductsSchema), productController.getAllProducts);
router.get('/:id', validate(productValidators.getProductByIdSchema), productController.getProductById);
router.get('/category/:categoryId', validate(productValidators.getProductsByCategorySchema), productController.getProductsByCategory);

export default router;