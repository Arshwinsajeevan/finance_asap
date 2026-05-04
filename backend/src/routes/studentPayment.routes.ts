import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { 
  createStudentPaymentSchema, 
  updateStudentPaymentSchema, 
  refundStudentPaymentSchema 
} from '../schemas/studentPayment.schema';
import { withCacheBust } from '../middleware/cacheBust';
import * as ctrl from '../controllers/studentPayment.controller';

const router = Router();

router.use(authenticate);

router.post('/', authorize('FINANCE_OFFICER'), validate(createStudentPaymentSchema), withCacheBust(ctrl.createStudentPayment));
router.get('/summary', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getStudentPaymentSummary);
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), ctrl.getStudentPayments);

router.patch('/:id/installment', authorize('FINANCE_OFFICER'), validate(updateStudentPaymentSchema), withCacheBust(ctrl.recordInstallment));
router.patch('/:id/refund', authorize('FINANCE_OFFICER'), validate(refundStudentPaymentSchema), withCacheBust(ctrl.issueRefund));

export default router;
