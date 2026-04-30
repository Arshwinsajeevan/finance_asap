const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { createInvoiceSchema, updateInvoiceStatusSchema } = require('../schemas/invoice.schema');
const { getInvoices, createInvoice, updateInvoiceStatus } = require('../controllers/invoice.controller');

// Protect all routes
router.use(authenticate);

// Invoices are accessible to Finance and Admin
router.get('/', authorize(['FINANCE_OFFICER', 'ADMIN']), getInvoices);
router.post('/', authorize(['FINANCE_OFFICER']), validate(createInvoiceSchema), createInvoice);
router.patch('/:id/status', authorize(['FINANCE_OFFICER']), validate(updateInvoiceStatusSchema), updateInvoiceStatus);

module.exports = router;
