const { z } = require('zod');
const config = require('../config');

const createTransactionSchema = z.object({
  transactionType: z.enum(config.TRANSACTION_TYPES, {
    errorMap: () => ({ message: `Must be one of: ${config.TRANSACTION_TYPES.join(', ')}` }),
  }),
  source: z.enum(config.VERTICALS, {
    errorMap: () => ({ message: `Must be one of: ${config.VERTICALS.join(', ')}` }),
  }),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']).optional().default('SUCCESS'),
  userId: z.string().uuid().optional(),
});

module.exports = { createTransactionSchema };
