import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { status, vertical, direction } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (vertical) where.vertical = vertical;
    if (direction) where.direction = direction;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Add summary totals separated by direction
    const totals = {
      outbound: invoices.filter(i => i.direction === 'OUTBOUND').reduce((sum, i) => sum + (i.totalAmount || 0), 0),
      inbound: invoices.filter(i => i.direction === 'INBOUND').reduce((sum, i) => sum + (i.totalAmount || 0), 0)
    };

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
export const createInvoice = async (req: Request | any, res: Response) => {
  try {
    const { vertical, clientName, baseAmount, gstPercent, tdsPercent, panGstin, description, direction: bodyDirection, invoiceNumber: extInvoiceNumber, requestId } = req.body;
    
    let dir = bodyDirection === 'INBOUND' ? 'INBOUND' : 'OUTBOUND';
    
    // If linked to a request, let the request dictate the direction
    if (requestId) {
      const request = await prisma.invoiceRequest.findUnique({ where: { id: requestId } });
      if (request?.direction) {
        dir = request.direction as any;
      }
    }

    // ── Server-side tax computations (never trust frontend math) ──
    const bAmt = Number(baseAmount);
    const gPct = Number(gstPercent);
    const tPct = Number(tdsPercent) || 0;

    const gstAmount = (bAmt * gPct) / 100;
    const cgstAmount = gstAmount / 2;            // Equal CGST/SGST split
    const sgstAmount = gstAmount / 2;
    const totalAmount = bAmt + gstAmount;         // Gross invoice value
    const tdsAmount = (bAmt * tPct) / 100;      // TDS on base amount
    const netReceivable = totalAmount - tdsAmount; // What actually gets collected

    // ── Generate or use sequential invoice number ──
    let finalInvoiceNumber = extInvoiceNumber;
    if (!finalInvoiceNumber) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalInvoiceNumber = dir === 'INBOUND' ? `BILL-${dateStr}-${rand}` : `INV-${dateStr}-${rand}`;
    }

    // ── Atomic: Create Invoice + Audit Log ──
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber: finalInvoiceNumber,
          direction: dir,
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

      if (requestId) {
        await tx.invoiceRequest.update({
          where: { id: requestId },
          data: {
            status: 'PROCESSED',
            invoiceId: inv.id
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Invoice',
          entityId: inv.id,
          details: JSON.stringify({
            invoiceNumber: finalInvoiceNumber,
            direction: dir,
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
          performedBy: req.user.id || req.user.userId,
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

export const updateInvoiceStatus = async (req: Request | any, res: Response) => {
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
            transactionType: inv.direction === 'INBOUND' ? 'BILL_PAYMENT' : 'INVOICE_PAYMENT',
            source: inv.vertical!,
            amount: inv.totalAmount!,
            description: inv.direction === 'INBOUND'
              ? `Vendor bill payment for ${inv.invoiceNumber} (${inv.clientName})`
              : `Invoice payment received for ${inv.invoiceNumber} (${inv.clientName})`,
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
export const createInvoiceRequest = async (req: Request | any, res: Response) => {
  try {
    const { vertical, clientName, amount, description, direction, category, attachmentUrl } = req.body;
    const requestedById = req.user.id || req.user.userId;

    const request = await prisma.invoiceRequest.create({
      data: {
        vertical,
        clientName,
        amount: Number(amount),
        description,
        direction: direction || 'OUTBOUND',
        category: category || 'GENERAL',
        attachmentUrl,
        requestedById
      }
    });

    return success(res, request, 'Invoice request submitted successfully', 201);
  } catch (err) {
    console.error('Create Invoice Request Error:', err);
    return error(res, 'Failed to submit invoice request');
  }
};

export const getInvoiceRequests = async (req: Request | any, res: Response) => {
  try {
    const userRole = req.user.role;
    const userVertical = req.user.vertical;
    const { status } = req.query as any;

    const where: any = {};
    if (status) where.status = status;

    // If not finance/admin, restrict to their vertical
    if (userRole !== 'FINANCE_OFFICER' && userRole !== 'ADMIN') {
      where.vertical = userVertical;
    }

    const requests = await prisma.invoiceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { name: true, email: true } },
        invoice: { select: { invoiceNumber: true, status: true } }
      }
    });

    return success(res, requests, 'Invoice requests retrieved');
  } catch (err) {
    console.error('Get Invoice Requests Error:', err);
    return error(res, 'Failed to fetch invoice requests');
  }
};

export const getInvoiceRequestCount = async (req: Request | any, res: Response) => {
  try {
    const count = await prisma.invoiceRequest.count({
      where: { status: 'PENDING' }
    });
    return success(res, { count }, 'Pending count retrieved');
  } catch (err) {
    return error(res, 'Failed to fetch request count');
  }
};
