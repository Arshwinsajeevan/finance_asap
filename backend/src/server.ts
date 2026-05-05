import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from './utils/redis';
import path from 'path';
import config from './config';
import { passport } from './middleware/auth';
import Fastify from 'fastify';

// Route imports
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import requisitionRoutes from './routes/requisition.routes';
import budgetRoutes from './routes/budget.routes';
import salaryRoutes from './routes/salary.routes';
import donorRoutes from './routes/donor.routes';
import bankRoutes from './routes/bank.routes';
import reportRoutes from './routes/report.routes';
import studentPaymentRoutes from './routes/studentPayment.routes';
import utilisationRoutes from './routes/utilisation.routes';
import invoiceRoutes from './routes/invoice.routes';
import refundRoutes from './routes/refund.routes';
import uploadRoutes from './routes/upload.routes';
import pettycashRoutes from './routes/pettycash.routes';

const app = express();

// ─── Global Middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(passport.initialize());

// ─── Rate Limiting (Fully Done with Redis) ───────────────────
const createLimiter = (windowMs: number, max: number, message: string) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
  store: (redis as any).status === 'ready' ? new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
  }) : undefined,
});

const globalLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later.');
const loginLimiter = createLimiter(60 * 1000, 5, 'Too many login attempts. Please try again after 1 minute.');

// ─── API Routes ──────────────────────────────────────────────
app.use('/api', globalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/finance/transactions', transactionRoutes);
app.use('/api/finance/requisitions', requisitionRoutes);
app.use('/api/finance/petty-cash', pettycashRoutes);
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
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', module: 'ASAP Finance', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Fastify Hybrid Setup ────────────────────────────────────
const fastify = Fastify({ logger: true });

const start = async () => {
  try {
    await fastify.register(require('@fastify/express'));
    (fastify as any).use(app);
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    
    console.log(`\n🏦 ASAP Finance API Server (Hybrid Fastify + Express TS)`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   URL: http://localhost:${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/api/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export { app, fastify };
