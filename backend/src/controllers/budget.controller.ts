import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

/**
 * POST /api/finance/budget
 */
export const createOrUpdateBudget = async (req: Request | any, res: Response) => {
  try {
    const { vertical, financialYear, allocated, description } = req.body;

    const budget = await prisma.budget.upsert({
      where: {
        vertical_financialYear: { vertical, financialYear },
      },
      update: { allocated, description },
      create: { vertical, financialYear, allocated, description },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Budget',
        entityId: budget.id,
        details: JSON.stringify({ vertical, financialYear, allocated }),
        performedBy: req.user.id,
      },
    });

    return success(res, budget, 'Budget updated successfully');
  } catch (err) {
    console.error('Budget update error:', err);
    return error(res, 'Failed to update budget');
  }
};

/**
 * GET /api/finance/budget
 */
export const getBudgets = async (req: Request, res: Response) => {
  try {
    const { financialYear } = req.query as { financialYear?: string };
    const where: any = {};
    if (financialYear) where.financialYear = financialYear;

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { vertical: 'asc' },
    });

    // Compute remaining for each budget
    const enriched = budgets.map((b) => ({
      ...b,
      remaining: (b.allocated || 0) - (b.used || 0),
      utilizationPercent: (b.allocated || 0) > 0 ? Math.round(((b.used || 0) / (b.allocated || 1)) * 100) : 0,
      isOverExhausted: (b.used || 0) > (b.allocated || 0),
    }));

    return success(res, enriched, 'Budgets retrieved');
  } catch (err) {
    console.error('Get budgets error:', err);
    return error(res, 'Failed to fetch budgets');
  }
};

/**
 * GET /api/finance/budget/:vertical
 */
export const getBudgetByVertical = async (req: Request, res: Response) => {
  try {
    const { vertical } = req.params;
    const { financialYear } = req.query as { financialYear?: string };

    const where: any = { vertical: (vertical as string).toUpperCase() };
    if (financialYear) where.financialYear = financialYear;

    const budgets = await prisma.budget.findMany({ where });

    const enriched = budgets.map((b) => ({
      ...b,
      remaining: (b.allocated || 0) - (b.used || 0),
      utilizationPercent: (b.allocated || 0) > 0 ? Math.round(((b.used || 0) / (b.allocated || 1)) * 100) : 0,
      isOverExhausted: (b.used || 0) > (b.allocated || 0),
    }));

    return success(res, enriched);
  } catch (err) {
    return error(res, 'Failed to fetch budget');
  }
};

/**
 * GET /api/finance/budget/utilisation
 */
export const getUtilisation = async (req: Request, res: Response) => {
  try {
    const budgets = await prisma.budget.findMany();

    const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const totalUsed = budgets.reduce((sum, b) => sum + (b.used || 0), 0);
    const totalReleased = budgets.reduce((sum, b) => sum + (b.released || 0), 0);
    const totalRemaining = totalAllocated - totalUsed;

    const byVertical = budgets.map((b) => ({
      vertical: b.vertical,
      financialYear: b.financialYear,
      allocated: b.allocated,
      used: b.used,
      released: b.released,
      remaining: (b.allocated || 0) - (b.used || 0),
      utilizationPercent: (b.allocated || 0) > 0 ? Math.round(((b.used || 0) / (b.allocated || 1)) * 100) : 0,
      isOverExhausted: (b.used || 0) > (b.allocated || 0),
    }));

    return success(res, {
      summary: { totalAllocated, totalUsed, totalReleased, totalRemaining },
      byVertical,
    });
  } catch (err) {
    console.error('Utilisation error:', err);
    return error(res, 'Failed to get utilisation data');
  }
};
