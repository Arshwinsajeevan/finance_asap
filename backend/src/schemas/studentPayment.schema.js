const { z } = require('zod');

const createStudentPaymentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  courseName: z.string().min(2, 'Course name is required'),
  totalFee: z.number().positive('Total fee must be positive'),
  paidAmount: z.number().nonnegative('Paid amount must be non-negative').default(0),
  paymentType: z.enum(['FEE', 'INSTALLMENT', 'REFUND']).default('FEE'),
  reference: z.string().optional(),
});

const updateStudentPaymentSchema = z.object({
  paidAmount: z.number().positive('Paid amount must be positive'),
  reference: z.string().optional(),
});

const refundStudentPaymentSchema = z.object({
  refundAmount: z.number().positive('Refund amount must be positive'),
  reference: z.string().optional(),
});

module.exports = {
  createStudentPaymentSchema,
  updateStudentPaymentSchema,
  refundStudentPaymentSchema
};
