const { z } = require('zod');
const config = require('../config');

const createBankRecordSchema = z.object({
  entryType: z.enum(config.BANK_ENTRY_TYPES, {
    errorMap: () => ({ message: `Must be one of: ${config.BANK_ENTRY_TYPES.join(', ')}` }),
  }),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  reference: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'RELEASED', 'FORFEITED']).optional().default('ACTIVE'),
});

module.exports = { createBankRecordSchema };
