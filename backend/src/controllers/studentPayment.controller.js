const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

exports.getStudentPayments = async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const where = {};
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
  } catch (error) {
    console.error('Get Student Payments Error:', error);
    return error(res, 'Failed to fetch student payments');
  }
};

exports.getStudentPaymentSummary = async (req, res) => {
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
  } catch (error) {
    console.error('Student Payment Summary Error:', error);
    return error(res, 'Failed to fetch payment summary');
  }
};

exports.createStudentPayment = async (req, res) => {
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
            userId: req.user.userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'StudentPayment',
          entityId: newPayment.id,
          performedBy: req.user.userId,
          details: JSON.stringify({ amount: data.paidAmount, total: data.totalFee })
        }
      });

      return newPayment;
    });

    return success(res, payment, 'Student payment record created', 201);
  } catch (error) {
    console.error('Create Student Payment Error:', error);
    return error(res, 'Failed to create student payment');
  }
};

exports.recordInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, reference } = req.body;

    const payment = await prisma.studentPayment.findUnique({ 
      where: { id },
      include: { student: true }
    });

    if (!payment) return error(res, 'Payment record not found', 404);
    if (payment.status === 'PAID') return error(res, 'Fee already fully paid', 400);

    const newTotalPaid = payment.paidAmount + paidAmount;
    let status = 'PARTIAL';
    if (newTotalPaid >= payment.totalFee) status = 'PAID';

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.studentPayment.update({
        where: { id },
        data: {
          paidAmount: newTotalPaid,
          status,
          installmentNo: payment.installmentNo + 1,
          paidAt: new Date(),
          reference: reference || payment.reference
        }
      });

      await tx.transaction.create({
        data: {
          transactionType: 'FEE_COLLECTION',
          source: payment.student.vertical || 'TRAINING',
          amount: paidAmount,
          description: `Fee payment for ${payment.courseName} by ${payment.student.name}`,
          reference: reference || p.id.substring(0, 8),
          userId: req.user.userId
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'StudentPayment',
          entityId: p.id,
          performedBy: req.user.userId,
          details: JSON.stringify({ installmentAmount: paidAmount, newTotalPaid })
        }
      });

      return p;
    });

    return success(res, updated, 'Installment recorded successfully');
  } catch (error) {
    console.error('Record Installment Error:', error);
    return error(res, 'Failed to record installment');
  }
};

exports.issueRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, reference } = req.body;

    const payment = await prisma.studentPayment.findUnique({ 
      where: { id },
      include: { student: true }
    });

    if (!payment) return error(res, 'Payment record not found', 404);
    if (payment.paidAmount < refundAmount) {
      return error(res, 'Refund amount cannot exceed paid amount', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.studentPayment.update({
        where: { id },
        data: {
          paidAmount: payment.paidAmount - refundAmount,
          status: 'REFUNDED',
          paymentType: 'REFUND',
          reference: reference || payment.reference
        }
      });

      await tx.transaction.create({
        data: {
          transactionType: 'REFUND',
          source: payment.student.vertical || 'TRAINING',
          amount: refundAmount,
          description: `Refund for ${payment.courseName} to ${payment.student.name}`,
          reference: reference || p.id.substring(0, 8),
          userId: req.user.userId
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'StudentPayment',
          entityId: p.id,
          performedBy: req.user.userId,
          details: JSON.stringify({ refundAmount, status: 'REFUNDED' })
        }
      });

      return p;
    });

    return success(res, updated, 'Refund processed successfully');
  } catch (error) {
    console.error('Issue Refund Error:', error);
    return error(res, 'Failed to issue refund');
  }
};
