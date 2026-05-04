import { z } from 'zod';

export const submitUtilisationSchema = z.object({
  requisitionId: z.string().min(1, 'Requisition ID is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  billNo: z.string().optional(),
});

export const verifyUtilisationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED'], {
    message: 'Status must be VERIFIED or REJECTED',
  }),
  rejectionNote: z.string().min(3, 'Rejection note must be at least 3 characters').optional(),
}).refine(
  (data) => {
    if (data.status === 'REJECTED' && (!data.rejectionNote || data.rejectionNote.trim().length < 3)) {
      return false;
    }
    return true;
  },
  { message: 'Rejection note is mandatory when rejecting a utilisation', path: ['rejectionNote'] }
);
