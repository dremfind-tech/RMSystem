import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { getAnalyticsDashboard } from '../controllers/analytics.controller';

const router = Router();

router.use(authenticateUser);

// GET /api/analytics/dashboard
router.get('/dashboard', requireRole(['ADMIN']), getAnalyticsDashboard);

export default router;
