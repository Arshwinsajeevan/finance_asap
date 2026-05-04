import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createDonorFundSchema } from '../schemas/donor.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/donor.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER', 'VERTICAL_USER'), validate(createDonorFundSchema), withCacheBust(ctrl.createDonorFund));
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getDonorSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getDonorFunds);

export default router;
