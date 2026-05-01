const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createSalarySchema } = require('../schemas/salary.schema');
const { withCacheBust } = require('../middleware/cacheBust');
const ctrl = require('../controllers/salary.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createSalarySchema), withCacheBust(ctrl.createSalary));
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getSalarySummary);
router.patch('/:id/pay', authorize('FINANCE_OFFICER'), withCacheBust(ctrl.markSalaryPaid));
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getSalaries);

module.exports = router;
