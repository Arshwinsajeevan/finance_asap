import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createRequisitionSchema, approveRequisitionSchema, rejectRequisitionSchema, releaseRequisitionSchema } from '../schemas/requisition.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/requisition.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), validate(createRequisitionSchema), withCacheBust(ctrl.createRequisition));
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRequisitions);
router.get('/:id', ctrl.getRequisition);
router.patch('/:id/approve', authorize('FINANCE_OFFICER'), validate(approveRequisitionSchema), withCacheBust(ctrl.approveRequisition));
router.patch('/:id/reject', authorize('FINANCE_OFFICER'), validate(rejectRequisitionSchema), withCacheBust(ctrl.rejectRequisition));
router.patch('/:id/release', authorize('FINANCE_OFFICER'), validate(releaseRequisitionSchema), withCacheBust(ctrl.releaseFunds));

export default router;
