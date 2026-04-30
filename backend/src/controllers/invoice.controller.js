const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

exports.getInvoices = async (req, res) => {
  try {
    const { status, vertical } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vertical) where.vertical = vertical;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    // Add summary totals
    const totals = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

    return success(res, { invoices, totals }, 'Invoices retrieved');
  } catch (err) {
    console.error('Get Invoices Error:', err);
    return error(res, 'Failed to fetch invoices');
  }
};

/**
 * POST /api/finance/invoices
 * Accepts taxation fields (panGstin, tdsPercent) and auto-computes
 * CGST/SGST splits and net receivable server-side.
 */
exports.createInvoice = async (req, res) => {
  try {
    const { vertical, clientName, baseAmount, gstPercent, tdsPercent, panGstin, description } = req.body;

    // ── Server-side tax computations (never trust frontend math) ──
    const bAmt = Number(baseAmount);
    const gPct = Number(gstPercent);
    const tPct = Number(tdsPercent) || 0;

    const gstAmount  = (bAmt * gPct) / 100;
    const cgstAmount = gstAmount / 2;            // Equal CGST/SGST split
    const sgstAmount = gstAmount / 2;
    const totalAmount = bAmt + gstAmount;         // Gross invoice value
    const tdsAmount   = (bAmt * tPct) / 100;      // TDS on base amount
    const netReceivable = totalAmount - tdsAmount; // What actually gets collected

    // ── Generate sequential invoice number ──
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${dateStr}-${rand}`;

    // ── Atomic: Create Invoice + Audit Log ──
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          vertical,
          clientName,
          panGstin: panGstin || null,
          baseAmount: bAmt,
          gstPercent: gPct,
          cgstAmount,
          sgstAmount,
          gstAmount,
          tdsPercent: tPct,
          totalAmount,
          status: 'DRAFT',
          description,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Invoice',
          entityId: inv.id,
          details: JSON.stringify({
            invoiceNumber,
            clientName,
            baseAmount: bAmt,
            gstPercent: gPct,
            cgstAmount,
            sgstAmount,
            tdsPercent: tPct,
            tdsAmount,
            totalAmount,
            netReceivable,
            panGstin: panGstin || null,
          }),
          performedBy: req.user.id,
        },
      });

      return inv;
    });

    return success(res, { ...invoice, netReceivable }, 'Invoice created successfully', 201);
  } catch (err) {
    console.error('Create Invoice Error:', err);
    return error(res, 'Failed to create invoice');
  }
};

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return error(res, 'Invoice not found', 404);

    if (status === 'PAID' && invoice.status !== 'APPROVED') {
      return error(res, 'Only APPROVED invoices can be marked as PAID', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data: { status }
      });

      if (status === 'PAID') {
        await tx.transaction.create({
          data: {
            transactionType: 'INVOICE_PAYMENT',
            source: inv.vertical,
            amount: inv.totalAmount,
            description: `Invoice payment received for ${inv.invoiceNumber} (${inv.clientName})`,
            reference: inv.invoiceNumber,
            userId: req.user.id || req.user.userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_INVOICE_STATUS',
          entity: 'Invoice',
          entityId: id,
          performedBy: req.user.id || req.user.userId,
          details: JSON.stringify({ oldStatus: invoice.status, newStatus: status })
        }
      });

      return inv;
    });

    return success(res, updated, `Invoice marked as ${status}`);
  } catch (err) {
    console.error('Update Invoice Error:', err);
    return error(res, 'Failed to update invoice status');
  }
};
