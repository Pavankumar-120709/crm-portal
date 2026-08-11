import { Router } from 'express';
import { addStockMovement, getAllStockMovements } from '../controllers/stockController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Stock Movement Log: ADMIN, WAREHOUSE, SALES, ACCOUNTS
router.get('/movements', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getAllStockMovements);

// Manual Stock Adjustment: ADMIN, WAREHOUSE
router.post('/movement', authorizeRoles('ADMIN', 'WAREHOUSE'), addStockMovement);

export default router;
