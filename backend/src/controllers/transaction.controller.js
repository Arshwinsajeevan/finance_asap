const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/response');

/**
 * POST /api/finance/transactions
 */
const createTransaction = async (req, res) => {
  try {
    const transaction = await prisma.transaction.create({
      data: req.body,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Transaction',
        entityId: transaction.id,
        details: JSON.stringify(req.body),
        performedBy: req.user.id,
      },
    });

    return success(res, transaction, 'Transaction created successfully', 201);
  } catch (err) {
    console.error('Create transaction error:', err);
    return error(res, 'Failed to create transaction');
  }
};

/**
 * GET /api/finance/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, source, status, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.transactionType = type;
    if (source) where.source = source;
    if (status) where.status = status;
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
const getTransaction = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
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
const getTransactionSummary = async (req, res) => {
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

module.exports = { createTransaction, getTransactions, getTransaction, getTransactionSummary };
