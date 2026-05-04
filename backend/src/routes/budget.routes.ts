import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/budget.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), withCacheBust(ctrl.createOrUpdateBudget));
router.get('/utilisation', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisation);
router.get('/:vertical', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBudgetByVertical);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBudgets);

export default router;
