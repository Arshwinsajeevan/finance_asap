const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

/**
 * POST /api/finance/budget
 */
const createOrUpdateBudget = async (req, res) => {
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
const getBudgets = async (req, res) => {
  try {
    const { financialYear } = req.query;
    const where = {};
    if (financialYear) where.financialYear = financialYear;

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { vertical: 'asc' },
    });

    // Compute remaining for each budget
    const enriched = budgets.map((b) => ({
      ...b,
      remaining: b.allocated - b.used,
      utilizationPercent: b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0,
      isOverExhausted: b.used > b.allocated,
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
const getBudgetByVertical = async (req, res) => {
  try {
    const { vertical } = req.params;
    const { financialYear } = req.query;

    const where = { vertical: vertical.toUpperCase() };
    if (financialYear) where.financialYear = financialYear;

    const budgets = await prisma.budget.findMany({ where });

    const enriched = budgets.map((b) => ({
      ...b,
      remaining: b.allocated - b.used,
      utilizationPercent: b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0,
      isOverExhausted: b.used > b.allocated,
    }));

    return success(res, enriched);
  } catch (err) {
    return error(res, 'Failed to fetch budget');
  }
};

/**
 * GET /api/finance/budget/utilisation
 */
const getUtilisation = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany();

    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const totalUsed = budgets.reduce((sum, b) => sum + b.used, 0);
    const totalReleased = budgets.reduce((sum, b) => sum + b.released, 0);
    const totalRemaining = totalAllocated - totalUsed;

    const byVertical = budgets.map((b) => ({
      vertical: b.vertical,
      financialYear: b.financialYear,
      allocated: b.allocated,
      used: b.used,
      released: b.released,
      remaining: b.allocated - b.used,
      utilizationPercent: b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0,
      isOverExhausted: b.used > b.allocated,
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

module.exports = { createOrUpdateBudget, getBudgets, getBudgetByVertical, getUtilisation };
