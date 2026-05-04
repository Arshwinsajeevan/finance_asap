import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export const getStudentPayments = async (req: Request, res: Response) => {
  try {
    const { status, studentId } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const payments = await prisma.studentPayment.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, vertical: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, payments, 'Student payments retrieved successfully');
  } catch (err) {
    console.error('Get Student Payments Error:', err);
    return error(res, 'Failed to fetch student payments');
  }
};

export const getStudentPaymentSummary = async (req: Request, res: Response) => {
  try {
    const totals = await prisma.studentPayment.aggregate({
      _sum: { paidAmount: true, totalFee: true },
      _count: true,
      where: { status: { in: ['PAID', 'PARTIAL'] } }
    });

    const byStatus = await prisma.studentPayment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalFee: true, paidAmount: true }
    });

    return success(res, { totals, byStatus }, 'Student payment summary retrieved');
  } catch (err) {
    console.error('Student Payment Summary Error:', err);
    return error(res, 'Failed to fetch payment summary');
  }
};

export const createStudentPayment = async (req: Request | any, res: Response) => {
  try {
    const data = req.body;
    
    // Check if student exists
    const student = await prisma.user.findUnique({ where: { id: data.studentId } });
    if (!student) {
      return error(res, 'Student not found', 404);
    }

    let status = 'PENDING';
    if (data.paidAmount >= data.totalFee) status = 'PAID';
    else if (data.paidAmount > 0) status = 'PARTIAL';

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.studentPayment.create({
        data: {
          ...data,
          status,
          paidAt: data.paidAmount > 0 ? new Date() : null
        },
        include: { student: true }
      });

      // If initial payment > 0, create ledger transaction
      if (data.paidAmount > 0) {
        await tx.transaction.create({
          data: {
            transactionType: 'FEE_COLLECTION',
            source: student.vertical || 'TRAINING',
            amount: data.paidAmount,
            description: `Fee payment for ${data.courseName} by ${student.name}`,
            reference: data.reference || newPayment.id.substring(0, 8),
            userId: req.user.userId || req.user.id
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'StudentPayment',
          entityId: newPayment.id,
          performedBy: req.user.userId || req.user.id,
          details: JSON.stringify({ amount: data.paidAmount, total: data.totalFee })
        }
      });

      return newPayment;
    });

    return success(res, payment, 'Student payment record created', 201);
  } catch (err) {
    console.error('Create Student Payment Error:', err);
    return error(res, 'Failed to create student payment');
  }
};

export const recordInstallment = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const { paidAmount, reference } = req.body;

    const payment = await prisma.studentPayment.findUnique({ 
      where: { id },
      include: { student: true }
    });

    if (!payment) return error(res, 'Payment record not found', 404);
    if (payment.status === 'PAID') return error(res, 'Fee already fully paid', 400);

    const newTotalPaid = (payment.paidAmount || 0) + (paidAmount || 0);
    let status = 'PARTIAL';
    if (newTotalPaid >= (payment.totalFee || 0)) status = 'PAID';

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.studentPayment.update({
        where: { id },
        data: {
          paidAmount: newTotalPaid,
          status,
          installmentNo: (payment.installmentNo || 0) + 1,
          paidAt: new Date(),
          reference: reference || payment.reference
        }
      });

      await tx.transaction.create({
        data: {
          transactionType: 'FEE_COLLECTION',
          source: (payment.student as any)?.vertical || 'TRAINING',
          amount: paidAmount,
          description: `Fee payment for ${payment.courseName} by ${(payment.student as any)?.name}`,
          reference: reference || p.id.substring(0, 8),
          userId: req.user.userId || req.user.id
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'StudentPayment',
          entityId: p.id,
          performedBy: req.user.userId || req.user.id,
          details: JSON.stringify({ installmentAmount: paidAmount, newTotalPaid })
        }
      });

      return p;
    });

    return success(res, updated, 'Installment recorded successfully');
  } catch (err) {
    console.error('Record Installment Error:', err);
    return error(res, 'Failed to record installment');
  }
};

export const issueRefund = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const { refundAmount, reference } = req.body;

    const payment = await prisma.studentPayment.findUnique({ 
      where: { id },
      include: { student: true }
    });

    if (!payment) return error(res, 'Payment record not found', 404);
    if ((payment.paidAmount || 0) < refundAmount) {
      return error(res, 'Refund amount cannot exceed paid amount', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.studentPayment.update({
        where: { id },
        data: {
          paidAmount: (payment.paidAmount || 0) - refundAmount,
          status: 'REFUNDED',
          paymentType: 'REFUND',
          reference: reference || payment.reference
        }
      });

      await tx.transaction.create({
        data: {
          transactionType: 'REFUND',
          source: (payment.student as any)?.vertical || 'TRAINING',
          amount: refundAmount,
          description: `Refund for ${payment.courseName} to ${(payment.student as any)?.name}`,
          reference: reference || p.id.substring(0, 8),
          userId: req.user.userId || req.user.id
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'StudentPayment',
          entityId: p.id,
          performedBy: req.user.userId || req.user.id,
          details: JSON.stringify({ refundAmount, status: 'REFUNDED' })
        }
      });

      return p;
    });

    return success(res, updated, 'Refund processed successfully');
  } catch (err) {
    console.error('Issue Refund Error:', err);
    return error(res, 'Failed to issue refund');
  }
};
