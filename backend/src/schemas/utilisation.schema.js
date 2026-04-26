const { z } = require('zod');

const submitUtilisationSchema = z.object({
  requisitionId: z.string().uuid('Invalid requisition ID'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(2, 'Description is required'),
  billNo: z.string().optional(),
});

const verifyUtilisationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionNote: z.string().optional(),
});

module.exports = {
  submitUtilisationSchema,
  verifyUtilisationSchema
};
