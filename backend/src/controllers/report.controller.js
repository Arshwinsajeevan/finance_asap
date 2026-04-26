const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

const getOverview = async (req, res) => {
  try {
    const [totalTransactions, totalRequisitions, pendingRequisitions, budgets, salaryTotal, donorTotal, recentTransactions] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.requisition.count(),
      prisma.requisition.count({ where: { status: 'PENDING' } }),
      prisma.budget.findMany(),
      prisma.salary.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.donorFund.aggregate({ _sum: { amount: true } }),
      prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true } } } }),
    ]);

    const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
    const totalUsed = budgets.reduce((s, b) => s + b.used, 0);
    const totalReleased = budgets.reduce((s, b) => s + b.released, 0);

    return success(res, {
      stats: {
        totalFunds: totalAllocated,
        fundsSpent: totalUsed,
        fundsRemaining: totalAllocated - totalUsed,
        fundsReleased: totalReleased,
        pendingRequisitions,
        totalRequisitions,
        totalTransactions: totalTransactions._count,
        transactionVolume: totalTransactions._sum.amount || 0,
        salariesPaid: salaryTotal._sum.amount || 0,
        donorFunds: donorTotal._sum.amount || 0,
      },
      recentTransactions,
    });
  } catch (err) {
    return error(res, 'Failed to get overview');
  }
};

const getAnnualReport = async (req, res) => {
  try {
    const { year } = req.query;
    const fy = year || '2025-26';

    const [budgets, transactions, salaries, donors, requisitions] = await Promise.all([
      prisma.budget.findMany({ where: { financialYear: fy } }),
      prisma.transaction.groupBy({ by: ['transactionType'], _sum: { amount: true }, _count: true }),
      prisma.salary.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PAID' } }),
      prisma.donorFund.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.requisition.groupBy({ by: ['status'], _count: true }),
    ]);

    return success(res, { financialYear: fy, budgets, transactions, salaries, donors, requisitions });
  } catch (err) {
    return error(res, 'Failed to generate report');
  }
};

const getVerticalReport = async (req, res) => {
  try {
    const vertical = req.params.name.toUpperCase();
    const [budget, transactions, requisitions, salaries] = await Promise.all([
      prisma.budget.findMany({ where: { vertical } }),
      prisma.transaction.findMany({ where: { source: vertical }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.requisition.findMany({ where: { vertical }, orderBy: { createdAt: 'desc' } }),
      prisma.salary.findMany({ where: { vertical }, orderBy: { createdAt: 'desc' } }),
    ]);
    return success(res, { vertical, budget, transactions, requisitions, salaries });
  } catch (err) {
    return error(res, 'Failed to get vertical report');
  }
};

module.exports = { getOverview, getAnnualReport, getVerticalReport };
