const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { passport } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const requisitionRoutes = require('./routes/requisition.routes');
const budgetRoutes = require('./routes/budget.routes');
const salaryRoutes = require('./routes/salary.routes');
const donorRoutes = require('./routes/donor.routes');
const bankRoutes = require('./routes/bank.routes');
const reportRoutes = require('./routes/report.routes');
const studentPaymentRoutes = require('./routes/studentPayment.routes');
const utilisationRoutes = require('./routes/utilisation.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const refundRoutes = require('./routes/refund.routes');

const app = express();

// ─── Global Middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ─── Rate Limiting ───────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute window
  max: 5,                  // 5 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 1 minute.',
  },
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);  // Apply BEFORE the route
app.use('/api/auth', authRoutes);
app.use('/api/finance/transactions', transactionRoutes);
app.use('/api/finance/requisitions', requisitionRoutes);
app.use('/api/finance/budget', budgetRoutes);
app.use('/api/finance/salaries', salaryRoutes);
app.use('/api/finance/donors', donorRoutes);
app.use('/api/finance/bank', bankRoutes);
app.use('/api/finance/reports', reportRoutes);
app.use('/api/finance/student-payments', studentPaymentRoutes);
app.use('/api/finance/utilisations', utilisationRoutes);
app.use('/api/finance/invoices', invoiceRoutes);
app.use('/api/finance/refunds', refundRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'ASAP Finance', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🏦 ASAP Finance API Server`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   URL: http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health\n`);
});

module.exports = app;
