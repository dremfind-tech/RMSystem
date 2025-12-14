import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/orders.controller';

const router = Router();

router.use(authenticateUser);

router.post('/', requireRole(['WAITER', 'ADMIN']), createOrder);
router.get('/', getOrders); // Roles handled in controller logic
router.get('/:id', getOrderById);
router.put('/:id/status', requireRole(['CHEF', 'WAITER', 'ADMIN']), updateOrderStatus);

export default router;
