import { Router } from 'express';
import { getChallans, getChallanById, createChallan, confirmChallan, cancelChallan } from '../controllers/challanController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// View Challans: ADMIN, SALES, WAREHOUSE, ACCOUNTS
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallans);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallanById);

// Create Challan (DRAFT): ADMIN, SALES
router.post('/', authorizeRoles('ADMIN', 'SALES'), createChallan);

// Confirm Challan (Deduct stock): ADMIN, SALES, WAREHOUSE
router.post('/:id/confirm', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE'), confirmChallan);

// Cancel Challan: ADMIN, SALES
router.post('/:id/cancel', authorizeRoles('ADMIN', 'SALES'), cancelChallan);

export default router;
