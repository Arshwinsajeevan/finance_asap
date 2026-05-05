import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error, paginated } from '../utils/response';

/**
 * IMPORTANT: The Transaction table is an append-only financial ledger.
 * There is NO public create/update/delete endpoint.
 * Transactions are ONLY created internally by other controllers
 * (salary, requisition, refund, invoice, donor) inside prisma.$transaction blocks.
 */

/**
 * GET /api/finance/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, source, status, search, from, to } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (type) where.transactionType = type;
    if (source) where.source = source;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    return paginated(res, transactions, total, page, limit, 'Transactions retrieved');
  } catch (err) {
    console.error('Get transactions error:', err);
    return error(res, 'Failed to fetch transactions');
  }
};

/**
 * GET /api/finance/transactions/:id
 */
export const getTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id as string },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!transaction) {
      return error(res, 'Transaction not found', 404);
    }

    return success(res, transaction);
  } catch (err) {
    return error(res, 'Failed to fetch transaction');
  }
};

/**
 * GET /api/finance/transactions/summary
 */
export const getTransactionSummary = async (req: Request, res: Response) => {
  try {
    const [byType, bySource, byStatus, totals] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['source'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return success(res, { byType, bySource, byStatus, totals });
  } catch (err) {
    console.error('Transaction summary error:', err);
    return error(res, 'Failed to get transaction summary');
  }
};
