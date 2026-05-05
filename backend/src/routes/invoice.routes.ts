import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authorize from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceStatusSchema, createInvoiceRequestSchema } from '../schemas/invoice.schema';
import { withCacheBust } from '../middleware/cacheBust';
import { 
  getInvoices, 
  createInvoice, 
  updateInvoiceStatus, 
  createInvoiceRequest, 
  getInvoiceRequests, 
  getInvoiceRequestCount 
} from '../controllers/invoice.controller';

const router = Router();

// Protect all routes
router.use(authenticate);

// Request routes (accessible to Verticals to create, Finance to view)
router.post('/requests', validate(createInvoiceRequestSchema), withCacheBust(createInvoiceRequest));
router.get('/requests', getInvoiceRequests);
router.get('/requests/count', authorize('FINANCE_OFFICER'), getInvoiceRequestCount);

// Invoices are accessible to Finance and Admin
router.get('/', authorize('FINANCE_OFFICER', 'ADMIN'), getInvoices);
router.post('/', authorize('FINANCE_OFFICER'), validate(createInvoiceSchema), withCacheBust(createInvoice));
router.patch('/:id/status', authorize('FINANCE_OFFICER'), validate(updateInvoiceStatusSchema), withCacheBust(updateInvoiceStatus));

export default router;
