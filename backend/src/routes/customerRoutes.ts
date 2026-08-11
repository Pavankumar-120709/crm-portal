import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Read customers: ADMIN, SALES, ACCOUNTS
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomerById);

// Create/Update customers: ADMIN, SALES
router.post('/', authorizeRoles('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), updateCustomer);

// Delete customer: ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

export default router;
