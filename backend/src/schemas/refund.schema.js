const { z } = require('zod');

const createRefundSchema = z.object({
  studentPaymentId: z.string().min(1, 'Student payment ID is required'),
  refundAmount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

const verifyRefundSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be APPROVED or REJECTED' }),
  }),
  rejectionNote: z.string().min(3, 'Rejection note must be at least 3 characters').optional(),
}).refine(
  (data) => {
    if (data.status === 'REJECTED' && (!data.rejectionNote || data.rejectionNote.trim().length < 3)) {
      return false;
    }
    return true;
  },
  { message: 'Rejection note is mandatory when rejecting a refund', path: ['rejectionNote'] }
);

module.exports = { createRefundSchema, verifyRefundSchema };
