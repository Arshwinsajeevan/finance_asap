import { z } from 'zod';
import config from '../config';

export const createDonorFundSchema = z.object({
  donorName: z.string().min(2, 'Donor name is required'),
  donorType: z.enum(config.DONOR_TYPES as unknown as [string, ...string[]]).optional().default('INDIVIDUAL'),
  amount: z.number().positive('Amount must be positive'),
  vertical: z.enum(config.VERTICALS as unknown as [string, ...string[]]).optional(),
  project: z.string().optional(),
  purpose: z.string().optional(),
  reference: z.string().optional(),
});
