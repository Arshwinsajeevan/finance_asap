import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validateQuery } from '../middleware/validate';
import { transactionQuerySchema } from '../schemas/transaction.schema';
import * as ctrl from '../controllers/transaction.controller';

const router = Router();

router.use(authenticate);

// READ-ONLY ledger access — no POST/PUT/DELETE allowed
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransactionSummary);
router.get('/:id', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransaction);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransactions);

export default router;
