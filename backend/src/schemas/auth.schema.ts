import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Must be a valid email address')
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Must be a valid email address')
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['FINANCE_OFFICER', 'ADMIN', 'VERTICAL_USER', 'STUDENT']).optional(),
  vertical: z.enum(['TRAINING', 'CSP', 'SDC', 'FUND_RAISING', 'TBB', 'SECRETARIAT']).optional(),
  phone: z.string().optional(),
});
