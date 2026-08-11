import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductMovements } from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read products: All roles
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProducts);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductById);
router.get('/:id/movements', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductMovements);

// Manage products: ADMIN, WAREHOUSE
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE'), updateProduct);
router.delete('/:id', authorizeRoles('ADMIN'), deleteProduct);

export default router;
