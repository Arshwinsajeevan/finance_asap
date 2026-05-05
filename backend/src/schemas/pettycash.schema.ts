import { z } from 'zod';
import config from '../config';

export const issueAdvanceSchema = z.object({
  vertical: z.enum(config.VERTICALS as unknown as [string, ...string[]], {
    message: `Must be one of: ${config.VERTICALS.join(', ')}`,
  }),
  amount: z.number().positive('Advance amount must be positive'),
});

export const submitVoucherSchema = z.object({
  amount: z.number().positive('Expense amount must be positive'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
  date: z.string().datetime().optional(), // ISO string
  documentUrl: z.string().url('Invalid document URL').optional(),
});

export const actionVoucherSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status must be APPROVED or REJECTED',
  }),
  rejectionNote: z.string().optional(),
});
