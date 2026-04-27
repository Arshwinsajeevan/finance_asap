const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/refund.controller');

router.use(authenticate);

router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefundSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.getRefunds);

// For demo/testing creation
router.post('/', authorize('FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER'), ctrl.createRefundRequest);

// Finance action
router.patch('/:id/verify', authorize('FINANCE_OFFICER'), ctrl.verifyRefund);

module.exports = router;
