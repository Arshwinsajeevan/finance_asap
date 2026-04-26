const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createBankRecordSchema } = require('../schemas/bank.schema');
const ctrl = require('../controllers/bank.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createBankRecordSchema), ctrl.createBankRecord);
router.get('/guarantees', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getGuarantees);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getBankRecords);

module.exports = router;
