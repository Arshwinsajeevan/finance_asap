import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000'),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Constants
  ROLES: {
    FINANCE_OFFICER: 'FINANCE_OFFICER',
    ADMIN: 'ADMIN',
    VERTICAL_USER: 'VERTICAL_USER',
    STUDENT: 'STUDENT',
  } as const,

  VERTICALS: ['TRAINING', 'CSP', 'SDC', 'FUND_RAISING', 'TBB', 'SECRETARIAT'] as const,

  TRANSACTION_TYPES: ['STUDENT_PAYMENT', 'DONOR_FUND', 'SALARY', 'EXPENSE', 'FUND_RELEASE', 'REFUND'] as const,

  REQUISITION_STATUS: ['PENDING', 'APPROVED', 'REJECTED', 'FUNDS_RELEASED'] as const,

  SALARY_TYPES: ['EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'] as const,

  DONOR_TYPES: ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'SPONSORSHIP'] as const,

  BANK_ENTRY_TYPES: ['STATEMENT', 'EMD', 'BANK_GUARANTEE', 'FD', 'OTHER'] as const,
};

export default config;
