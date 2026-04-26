const { z } = require('zod');
const config = require('../config');

const createDonorFundSchema = z.object({
  donorName: z.string().min(2, 'Donor name is required'),
  donorType: z.enum(config.DONOR_TYPES).optional().default('INDIVIDUAL'),
  amount: z.number().positive('Amount must be positive'),
  vertical: z.enum(config.VERTICALS).optional(),
  project: z.string().optional(),
  purpose: z.string().optional(),
  reference: z.string().optional(),
});

module.exports = { createDonorFundSchema };
