const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

exports.getInvoices = async (req, res) => {
  try {
    const { direction, status, vertical } = req.query;
    const where = {};
    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (vertical) where.vertical = vertical;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    // Add summary totals
    const inboundTotal = invoices.filter(i => i.direction === 'INBOUND').reduce((sum, i) => sum + i.amount, 0);
    const outboundTotal = invoices.filter(i => i.direction === 'OUTBOUND').reduce((sum, i) => sum + i.amount, 0);

    return success(res, { invoices, totals: { inboundTotal, outboundTotal } }, 'Invoices retrieved');
  } catch (err) {
    console.error('Get Invoices Error:', err);
    return error(res, 'Failed to fetch invoices');
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const data = req.body;
    
    // Generate invoice number e.g. INV-IN-20260426-XXXX
    const prefix = data.direction === 'INBOUND' ? 'INV-IN' : 'INV-OUT';
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `${prefix}-${dateStr}-${rand}`;

    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        amount: Number(data.amount),
        invoiceNumber
      }
    });

    return success(res, invoice, 'Invoice created successfully', 201);
  } catch (err) {
    console.error('Create Invoice Error:', err);
    return error(res, 'Failed to create invoice');
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });

    return success(res, invoice, 'Invoice status updated');
  } catch (err) {
    console.error('Update Invoice Error:', err);
    return error(res, 'Failed to update invoice status');
  }
};
