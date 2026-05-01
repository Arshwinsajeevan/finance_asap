const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { withCacheBust } = require('../middleware/cacheBust');
const ctrl = require('../controllers/budget.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), withCacheBust(ctrl.createOrUpdateBudget));
router.get('/utilisation', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getUtilisation);
router.get('/:vertical', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBudgetByVertical);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBudgets);

module.exports = router;
