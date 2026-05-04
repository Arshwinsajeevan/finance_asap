import { z } from 'zod';
import config from '../config';

export const createSalarySchema = z.object({
  employeeType: z.enum(config.SALARY_TYPES as unknown as [string, ...string[]], {
    message: `Must be one of: ${config.SALARY_TYPES.join(', ')}`,
  }),
  employeeName: z.string().min(2, 'Employee name is required'),
  employeeId: z.string().optional(),
  vertical: z.enum(config.VERTICALS as unknown as [string, ...string[]]).optional(),
  grossAmount: z.number().positive('Gross amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM'),
  status: z.enum(['PENDING', 'PAID', 'FAILED']).optional().default('PENDING'),
  reference: z.string().optional(),
  commission: z.number().min(0).optional(),
  userId: z.string().uuid().optional(),
});
