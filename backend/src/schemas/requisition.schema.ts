import { z } from 'zod';
import config from '../config';

export const createRequisitionSchema = z.object({
  vertical: z.enum(config.VERTICALS as unknown as [string, ...string[]], {
    message: `Must be one of: ${config.VERTICALS.join(', ')}`,
  }),
  amount: z.number().positive('Amount must be positive'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
  description: z.string().optional(),
  financialYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Financial year format must be YYYY-YY (e.g., 2025-26)'),
});

export const approveRequisitionSchema = z.object({
  approvedAmount: z.number().positive('Approved amount must be positive').optional(),
});

export const rejectRequisitionSchema = z.object({
  rejectionNote: z.string().min(3, 'Rejection reason is required'),
});

export const releaseRequisitionSchema = z.object({
  releasedAmount: z.number().positive('Released amount must be positive'),
});
