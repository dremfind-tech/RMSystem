import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { getMenu, createCategory, createMenuItem, updateMenuItem, deleteMenuItem, updateCategory, deleteCategory } from '../controllers/menu.controller';

const router = Router();

router.use(authenticateUser);

router.get('/', getMenu); // WAITER, ADMIN, etc.
router.post('/category', requireRole(['ADMIN']), createCategory);
router.put('/category/:id', requireRole(['ADMIN']), updateCategory);
router.delete('/category/:id', requireRole(['ADMIN']), deleteCategory);

router.post('/item', requireRole(['ADMIN']), createMenuItem);
router.put('/item/:id', requireRole(['ADMIN']), updateMenuItem);
router.delete('/item/:id', requireRole(['ADMIN']), deleteMenuItem);

export default router;
