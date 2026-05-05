import { z } from 'zod';
import config from '../config';

/**
 * PAN/GSTIN validation:
 * - PAN: exactly 10 alphanumeric characters (e.g. ABCDE1234F)
 * - GSTIN: exactly 15 alphanumeric characters (e.g. 22ABCDE1234F1Z5)
 * - Field is optional — but if provided, must be one of these two lengths.
 */
const panGstinValidator = z
  .string()
  .toUpperCase()
  .optional()
  .refine(
    (val) => {
      if (!val || val.length === 0) return true; // Optional — empty is fine
      return val.length === 10 || val.length === 15;
    },
    { message: 'Must be a valid PAN (10 chars) or GSTIN (15 chars)' }
  )
  .refine(
    (val) => {
      if (!val || val.length === 0) return true;
      if (val.length === 10) return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val); // PAN format
      if (val.length === 15) return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/.test(val); // GSTIN format
      return false;
    },
    { message: 'Invalid PAN/GSTIN format. PAN: ABCDE1234F, GSTIN: 22ABCDE1234F1Z5' }
  );

export const createInvoiceSchema = z.object({
  vertical: z.enum([...config.VERTICALS, 'FINANCE'] as [string, ...string[]], {
    message: `Must be one of: ${config.VERTICALS.join(', ')}, FINANCE`,
  }),
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  baseAmount: z.number().positive('Base amount must be greater than 0'),
  gstPercent: z.number().int().min(0).max(28, 'GST cannot exceed 28%'),
  tdsPercent: z.number().min(0).max(30, 'TDS cannot exceed 30%').default(0),
  panGstin: panGstinValidator,
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  invoiceNumber: z.string().optional(),
  description: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED', 'PAID'], {
    message: 'Status must be DRAFT, APPROVED, or PAID',
  }),
});

export const createInvoiceRequestSchema = z.object({
  vertical: z.enum([...config.VERTICALS] as [string, ...string[]]),
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
  category: z.string().optional(),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
});
