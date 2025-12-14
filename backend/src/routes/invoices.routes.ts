import { Router } from 'express';
import { authenticateUser, requireRole } from '../middlewares/auth';
import { getInvoiceByOrderId } from '../controllers/invoices.controller';

const router = Router();

router.use(authenticateUser);

router.get('/:orderId', requireRole(['CASHIER', 'ADMIN']), getInvoiceByOrderId);

export default router;
