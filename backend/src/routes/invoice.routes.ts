import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../schemas/invoice.schema';
import { withCacheBust } from '../middleware/cacheBust';
import { getInvoices, createInvoice, updateInvoiceStatus } from '../controllers/invoice.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Invoices are accessible to Finance and Admin
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), getInvoices);
router.post('/', authorize('FINANCE_OFFICER'), validate(createInvoiceSchema), withCacheBust(createInvoice));
router.patch('/:id/status', authorize('FINANCE_OFFICER'), validate(updateInvoiceStatusSchema), withCacheBust(updateInvoiceStatus));

export default router;
