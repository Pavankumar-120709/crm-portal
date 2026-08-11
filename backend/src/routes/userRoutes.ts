import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);

export default router;
