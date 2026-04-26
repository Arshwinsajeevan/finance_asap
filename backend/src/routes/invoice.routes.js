const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { getInvoices, createInvoice, updateInvoiceStatus } = require('../controllers/invoice.controller');

// Protect all routes
router.use(authenticate);

// Invoices are accessible to Finance and Admin
router.get('/', authorize(['FINANCE_OFFICER', 'ADMIN']), getInvoices);
router.post('/', authorize(['FINANCE_OFFICER']), createInvoice);
router.patch('/:id/status', authorize(['FINANCE_OFFICER']), updateInvoiceStatus);

module.exports = router;
