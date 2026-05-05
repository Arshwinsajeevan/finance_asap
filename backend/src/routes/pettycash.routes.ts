import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  getAccounts,
  getVouchers,
  issueAdvance,
  submitVoucher,
  actionVoucher
} from '../controllers/pettycash.controller';
import {
  issueAdvanceSchema,
  submitVoucherSchema,
  actionVoucherSchema
} from '../schemas/pettycash.schema';

const router = Router();

// Middleware
router.use(authenticate);

// GET routes
router.get('/accounts', getAccounts);
router.get('/vouchers', getVouchers);

// POST routes
router.post(
  '/advance',
  authorize('ADMIN', 'FINANCE_OFFICER'),
  validate(issueAdvanceSchema),
  issueAdvance
);

router.post(
  '/vouchers',
  authorize('VERTICAL_USER'),
  validate(submitVoucherSchema),
  submitVoucher
);

// PATCH routes
router.patch(
  '/vouchers/:id/action',
  authorize('ADMIN', 'FINANCE_OFFICER'),
  validate(actionVoucherSchema),
  actionVoucher
);

export default router;
