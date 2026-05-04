import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createSalarySchema } from '../schemas/salary.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/salary.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createSalarySchema), withCacheBust(ctrl.createSalary));
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getSalarySummary);
router.patch('/:id/pay', authorize('FINANCE_OFFICER'), withCacheBust(ctrl.markSalaryPaid));
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getSalaries);

export default router;
