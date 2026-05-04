import { z } from 'zod';
import config from '../config';

export const transactionQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('20'),
  type: z.enum([...config.TRANSACTION_TYPES, 'FEE_COLLECTION', 'INVOICE_PAYMENT'] as [string, ...string[]]).optional(),
  source: z.enum([...config.VERTICALS, 'FINANCE'] as [string, ...string[]]).optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
