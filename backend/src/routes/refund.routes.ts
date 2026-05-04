import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createRefundSchema, verifyRefundSchema } from '../schemas/refund.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/refund.controller';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefundSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefunds);

// Refund request creation
router.post('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), validate(createRefundSchema), withCacheBust(ctrl.createRefundRequest));

// Finance action
router.patch('/:id/verify', authorize('FINANCE_OFFICER'), validate(verifyRefundSchema), withCacheBust(ctrl.verifyRefund));

export default router;
