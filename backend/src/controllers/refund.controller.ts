import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export const getRefunds = async (req: Request, res: Response) => {
  try {
    const { status } = req.query as any;
    const where: any = {};
    if (status) where.status = status;

    const refunds = await prisma.refundRequest.findMany({
      where,
      include: {
        studentPayment: {
          include: { student: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, refunds, 'Refund requests retrieved successfully');
  } catch (err) {
    console.error('Get Refunds Error:', err);
    return error(res, 'Failed to fetch refunds');
  }
};

export const getRefundSummary = async (req: Request, res: Response) => {
  try {
    const totals = await prisma.refundRequest.aggregate({
      _sum: { refundAmount: true },
      _count: true
    });

    const byStatus = await prisma.refundRequest.groupBy({
      by: ['status'],
      _count: true,
      _sum: { refundAmount: true }
    });

    return success(res, { totals, byStatus }, 'Refund summary retrieved');
  } catch (err) {
    console.error('Refund Summary Error:', err);
    return error(res, 'Failed to fetch refund summary');
  }
};

// For test data generation mostly, as Finance shouldn't create it
export const createRefundRequest = async (req: Request, res: Response) => {
  try {
    const { studentPaymentId, refundAmount, reason } = req.body;
    
    const payment = await prisma.studentPayment.findUnique({ where: { id: studentPaymentId } });
    if (!payment) return error(res, 'Payment not found', 404);
    
    if (refundAmount > (payment.paidAmount || 0)) {
      return error(res, 'Refund amount cannot exceed paid amount', 400);
    }

    const refund = await prisma.refundRequest.create({
      data: {
        studentPaymentId,
        refundAmount: Number(refundAmount),
        reason
      }
    });
    
    return success(res, refund, 'Refund request created', 201);
  } catch (err) {
    console.error('Create Refund Error:', err);
    return error(res, 'Failed to create refund request');
  }
};

export const verifyRefund = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    const refund = await prisma.refundRequest.findUnique({ 
      where: { id },
      include: { studentPayment: { include: { student: true } } }
    });

    if (!refund) return error(res, 'Refund request not found', 404);
    if (refund.status !== 'PENDING') return error(res, 'Refund is already verified or rejected', 400);

    if (status === 'REJECTED' && !rejectionNote) {
      return error(res, 'Rejection note is required', 400);
    }

    if (status === 'APPROVED' && (refund.refundAmount || 0) > (refund.studentPayment?.paidAmount || 0)) {
      return error(res, 'Refund amount exceeds paid amount', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.refundRequest.update({
        where: { id },
        data: {
          status,
          rejectionNote: status === 'REJECTED' ? rejectionNote : null,
        }
      });

      if (status === 'APPROVED') {
        const p = refund.studentPayment!;
        const newPaidAmount = (p.paidAmount || 0) - (refund.refundAmount || 0);
        let newStatus = 'PARTIAL';
        if (newPaidAmount === 0) newStatus = 'REFUNDED';

        await tx.studentPayment.update({
          where: { id: p.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus
          }
        });

        await tx.transaction.create({
          data: {
            transactionType: 'REFUND',
            source: (p.student as any)?.vertical || 'TRAINING',
            amount: refund.refundAmount!,
            description: `Refund approved for ${p.courseName} (${(p.student as any)?.name})`,
            reference: refund.id.substring(0, 8),
            userId: req.user.id || req.user.userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'VERIFY_REFUND',
          entity: 'RefundRequest',
          entityId: id,
          performedBy: req.user.id || req.user.userId,
          details: JSON.stringify({ status, refundAmount: refund.refundAmount })
        }
      });

      return r;
    });

    return success(res, updated, `Refund request ${status.toLowerCase()} successfully`);
  } catch (err) {
    console.error('Verify Refund Error:', err);
    return error(res, 'Failed to verify refund request');
  }
};
