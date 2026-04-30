const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validateQuery } = require('../middleware/validate');
const { transactionQuerySchema } = require('../schemas/transaction.schema');
const ctrl = require('../controllers/transaction.controller');

router.use(authenticate);

// READ-ONLY ledger access — no POST/PUT/DELETE allowed
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransactionSummary);
router.get('/:id', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getTransaction);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), validateQuery(transactionQuerySchema), ctrl.getTransactions);

module.exports = router;
