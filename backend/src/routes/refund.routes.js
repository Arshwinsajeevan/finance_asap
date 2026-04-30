const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createRefundSchema, verifyRefundSchema } = require('../schemas/refund.schema');
const ctrl = require('../controllers/refund.controller');

router.use(authenticate);

router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefundSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefunds);

// Refund request creation
router.post('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), validate(createRefundSchema), ctrl.createRefundRequest);

// Finance action
router.patch('/:id/verify', authorize('FINANCE_OFFICER'), validate(verifyRefundSchema), ctrl.verifyRefund);

module.exports = router;
