const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createTransactionSchema } = require('../schemas/transaction.schema');
const ctrl = require('../controllers/transaction.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createTransactionSchema), ctrl.createTransaction);
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransactionSummary);
router.get('/:id', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransaction);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransactions);

module.exports = router;
