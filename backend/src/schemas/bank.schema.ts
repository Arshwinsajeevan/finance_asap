import { z } from 'zod';
import config from '../config';

export const createBankRecordSchema = z.object({
  entryType: z.enum(config.BANK_ENTRY_TYPES as unknown as [string, ...string[]], {
    message: `Must be one of: ${config.BANK_ENTRY_TYPES.join(', ')}`,
  }),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  reference: z.string().optional(),
  validFrom: z.string().optional(), // Flexible string for date
  validUntil: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'RELEASED', 'FORFEITED']).optional().default('ACTIVE'),
});
