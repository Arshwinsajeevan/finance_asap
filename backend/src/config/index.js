require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Constants
  ROLES: {
    FINANCE_OFFICER: 'FINANCE_OFFICER',
    ADMIN: 'ADMIN',
    VERTICAL_USER: 'VERTICAL_USER',
    STUDENT: 'STUDENT',
  },

  VERTICALS: ['TRAINING', 'CSP', 'SDC', 'FUND_RAISING', 'TBB', 'SECRETARIAT'],

  TRANSACTION_TYPES: ['STUDENT_PAYMENT', 'DONOR_FUND', 'SALARY', 'EXPENSE', 'FUND_RELEASE', 'REFUND'],

  REQUISITION_STATUS: ['PENDING', 'APPROVED', 'REJECTED', 'FUNDS_RELEASED'],

  SALARY_TYPES: ['EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'],

  DONOR_TYPES: ['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'SPONSORSHIP'],

  BANK_ENTRY_TYPES: ['STATEMENT', 'EMD', 'BANK_GUARANTEE', 'FD', 'OTHER'],
};
