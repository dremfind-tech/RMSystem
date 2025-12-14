import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { createCategory, getMenu } from '../controllers/menu.controller';

const router = Router();

router.use(authenticateUser);

// GET /api/categories - reusing getMenu as it returns categories with items
router.get('/', getMenu); 

// POST /api/categories
router.post('/', requireRole(['ADMIN']), createCategory);

export default router;
