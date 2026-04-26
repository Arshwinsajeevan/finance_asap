const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { 
  createStudentPaymentSchema, 
  updateStudentPaymentSchema, 
  refundStudentPaymentSchema 
} = require('../schemas/studentPayment.schema');
const ctrl = require('../controllers/studentPayment.controller');

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createStudentPaymentSchema), ctrl.createStudentPayment);
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getStudentPaymentSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getStudentPayments);

router.patch('/:id/installment', authorize('FINANCE_OFFICER'), validate(updateStudentPaymentSchema), ctrl.recordInstallment);
router.patch('/:id/refund', authorize('FINANCE_OFFICER'), validate(refundStudentPaymentSchema), ctrl.issueRefund);

module.exports = router;
