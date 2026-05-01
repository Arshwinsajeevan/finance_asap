const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createRequisitionSchema, approveRequisitionSchema, rejectRequisitionSchema, releaseRequisitionSchema } = require('../schemas/requisition.schema');
const { withCacheBust } = require('../middleware/cacheBust');
const ctrl = require('../controllers/requisition.controller');

router.use(authenticate);

router.post('/', authorize('VERTICAL_USER', 'FINANCE_OFFICER', 'ADMIN'), validate(createRequisitionSchema), withCacheBust(ctrl.createRequisition));
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRequisitions);
router.get('/:id', ctrl.getRequisition);
router.patch('/:id/approve', authorize('FINANCE_OFFICER'), validate(approveRequisitionSchema), withCacheBust(ctrl.approveRequisition));
router.patch('/:id/reject', authorize('FINANCE_OFFICER'), validate(rejectRequisitionSchema), withCacheBust(ctrl.rejectRequisition));
router.patch('/:id/release', authorize('FINANCE_OFFICER'), validate(releaseRequisitionSchema), withCacheBust(ctrl.releaseFunds));

module.exports = router;
