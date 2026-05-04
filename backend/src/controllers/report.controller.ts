import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

export const getOverview = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    // ── Cache MISS: Run all queries ──
    const dateFilter: any = {};
    let prevDateFilter: any = {}; // For calculating trends

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dateFilter.createdAt = {
        gte: start,
        lte: end
      };
      
      const duration = end.getTime() - start.getTime();
      prevDateFilter.createdAt = {
        gte: new Date(start.getTime() - duration),
        lt: start
      };
    } else {
      // If no dates provided (All time), compare the last 30 days to the previous 30 days for trend indicators
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      prevDateFilter.createdAt = {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo
      };
    }

    const [transactions, requisitions, pendingUtilisation, budgets, recentTransactions, totalTransactions, topReceivables, topPayables, prevTransactions] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        where: { status: 'SUCCESS', ...dateFilter }
      }),
      prisma.requisition.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter
      }),
      prisma.utilisation.count({ where: { status: 'PENDING', ...dateFilter } }),
      prisma.budget.findMany(),
      prisma.transaction.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true } } } }),
      prisma.transaction.count({ where: dateFilter }),
      prisma.studentPayment.findMany({ 
        where: { status: { in: ['PENDING', 'PARTIAL'] }, ...dateFilter },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { student: { select: { name: true } } }
      }),
      prisma.requisition.findMany({
        where: { status: 'PENDING', ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { raisedBy: { select: { name: true } } }
      }),
      // Query previous period transactions for trend calculations
      prisma.transaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        where: { status: 'SUCCESS', ...prevDateFilter }
      })
    ]);

    let income = 0;
    let expenses = 0;
    
    let revenueSplit = { fees: 0, donors: 0, other: 0 };
    let expenseSplit = { salaries: 0, requisitions: 0, refunds: 0, other: 0 };

    transactions.forEach((t: any) => {
      const amt = t._sum.amount || 0;
      if (t.transactionType === 'STUDENT_PAYMENT') {
        income += amt; revenueSplit.fees += amt;
      } else if (t.transactionType === 'DONOR_FUND') {
        income += amt; revenueSplit.donors += amt;
      } else if (t.transactionType === 'SALARY') {
        expenses += amt; expenseSplit.salaries += amt;
      } else if (t.transactionType === 'FUND_RELEASE') {
        expenses += amt; expenseSplit.requisitions += amt;
      } else if (t.transactionType === 'REFUND') {
        expenses += amt; expenseSplit.refunds += amt;
      } else if (t.transactionType === 'INVOICE_PAYMENT') {
        expenses += amt; expenseSplit.other += amt;
      }
    });

    let prevIncome = 0;
    let prevExpenses = 0;
    let prevFundsReleased = 0;

    prevTransactions.forEach((t: any) => {
      const amt = t._sum.amount || 0;
      if (t.transactionType === 'STUDENT_PAYMENT' || t.transactionType === 'DONOR_FUND') {
        prevIncome += amt;
      } else if (t.transactionType === 'SALARY' || t.transactionType === 'FUND_RELEASE' || t.transactionType === 'REFUND' || t.transactionType === 'INVOICE_PAYMENT') {
        prevExpenses += amt;
      }
      if (t.transactionType === 'FUND_RELEASE') {
        prevFundsReleased += amt;
      }
    });

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    const trends = {
      income: calculateTrend(income, prevIncome),
      expenses: calculateTrend(expenses, prevExpenses),
      fundsReleased: calculateTrend(expenseSplit.requisitions, prevFundsReleased),
      netBalance: calculateTrend(income - expenses, prevIncome - prevExpenses)
    };

    const totalAllocated = budgets.reduce((s, b) => s + (b.allocated || 0), 0);
    const totalUsed = budgets.reduce((s, b) => s + (b.used || 0), 0);
    const pendingReqCount = requisitions.find(r => r.status === 'PENDING')?._count || 0;
    
    // Process Receivables and Payables
    const formattedReceivables = topReceivables.map((r: any) => ({
      id: r.id,
      client: r.student?.name || 'Unknown Student',
      amount: (r.totalFee || 0) - (r.paidAmount || 0),
      dueDate: r.createdAt,
      status: r.status
    }));

    const formattedPayables = topPayables.map((r: any) => ({
      id: r.id,
      vendor: r.purpose,
      amount: r.amount,
      date: r.createdAt,
      status: r.status
    }));

    const overBudgetVerticals = budgets.filter(b => (b.used || 0) > (b.allocated || 0)).map(b => b.vertical);
    
    const openingBalance = 0; 

    const responseData = {
      stats: {
        totalBudget: totalAllocated,
        budgetUsed: totalUsed,
        budgetRemaining: totalAllocated - totalUsed,
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses,
        pendingRequisitions: pendingReqCount,
        pendingUtilisation,
        totalTransactions,
        openingBalance,
        totalInflow: income,
        totalOutflow: expenses,
        closingBalance: openingBalance + income - expenses,
        overBudgetAlerts: overBudgetVerticals,
        trends
      },
      revenueSplit,
      expenseSplit,
      topReceivables: formattedReceivables,
      topPayables: formattedPayables,
      budgets,
      recentTransactions,
    };

    return success(res, responseData, 'Dashboard overview');
  } catch (err) {
    console.error('Overview Error:', err);
    return error(res, 'Failed to get overview');
  }
};

export const getAnnualReport = async (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    
    const [transactions, budgets] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['transactionType'],
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      }),
      prisma.budget.findMany()
    ]);

    let income = { fees: 0, donors: 0, total: 0 };
    let expenses = { salaries: 0, requisitions: 0, refunds: 0, total: 0 };

    transactions.forEach((t: any) => {
      const amt = t._sum.amount || 0;
      if (t.transactionType === 'STUDENT_PAYMENT') income.fees += amt;
      else if (t.transactionType === 'DONOR_FUND') income.donors += amt;
      else if (t.transactionType === 'SALARY') expenses.salaries += amt;
      else if (t.transactionType === 'FUND_RELEASE') expenses.requisitions += amt;
      else if (t.transactionType === 'REFUND') expenses.refunds += amt;
    });

    income.total = income.fees + income.donors;
    expenses.total = expenses.salaries + expenses.requisitions + expenses.refunds;

    return success(res, {
      income,
      expenses,
      netBalance: income.total - expenses.total,
      budgets
    });
  } catch (err) {
    console.error('Annual Report Error:', err);
    return error(res, 'Failed to generate report');
  }
};

export const getVerticalReport = async (req: Request, res: Response) => {
  try {
    const vertical = (req.params.name as string).toUpperCase();
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
