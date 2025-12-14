import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { getMenu, createCategory, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu.controller';

const router = Router();

router.use(authenticateUser);

router.get('/', getMenu); // WAITER, ADMIN, etc.
router.post('/category', requireRole(['ADMIN']), createCategory);
router.post('/item', requireRole(['ADMIN']), createMenuItem);
router.put('/item/:id', requireRole(['ADMIN']), updateMenuItem);
router.delete('/item/:id', requireRole(['ADMIN']), deleteMenuItem);

export default router;
