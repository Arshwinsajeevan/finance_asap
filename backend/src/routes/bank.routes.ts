import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createBankRecordSchema } from '../schemas/bank.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/bank.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createBankRecordSchema), withCacheBust(ctrl.createBankRecord));
router.get('/guarantees', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getGuarantees);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBankRecords);

export default router;
