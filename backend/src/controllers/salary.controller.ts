import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error, paginated } from '../utils/response';

/**
 * POST /api/finance/salaries
 * Accepts grossAmount and auto-computes PF/TDS deductions server-side.
 *   - EMPLOYEE: 12% PF deduction
 *   - TRAINER / MENTOR: 10% TDS deduction
 *   - AGENT: no deductions (commission-based)
 * Stores the net payable as `amount`.
 */
export const createSalary = async (req: Request | any, res: Response) => {
  try {
    const { grossAmount, employeeType, ...rest } = req.body;

    // ── Server-side tax computation ──
    let pfAmount = 0;
    let tdsAmount = 0;

    if (employeeType === 'EMPLOYEE') {
      pfAmount = Math.round(grossAmount * 0.12 * 100) / 100; // 12% PF
    } else if (employeeType === 'TRAINER' || employeeType === 'MENTOR') {
      tdsAmount = Math.round(grossAmount * 0.10 * 100) / 100; // 10% TDS
    }
    // AGENT: no deductions — commission-based

    const netPayable = grossAmount - pfAmount - tdsAmount;

    // ── Atomic: Create Salary + Audit Log ──
    const salary = await prisma.$transaction(async (tx) => {
      const record = await tx.salary.create({
        data: {
          ...rest,
          employeeType,
          amount: netPayable,
          pfAmount,
          tdsAmount,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Salary',
          entityId: record.id,
          details: JSON.stringify({
            grossAmount,
            pfAmount,
            tdsAmount,
            netPayable,
            employeeType,
            month: rest.month,
          }),
          performedBy: req.user.id,
        },
      });

      return record;
    });

    return success(res, { ...salary, grossAmount }, 'Salary record created', 201);
  } catch (err) {
    console.error('Create salary error:', err);
    return error(res, 'Failed to create salary record');
  }
};

export const getSalaries = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, employeeType, month, status, vertical } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (employeeType) where.employeeType = employeeType;
    if (month) where.month = month;
    if (status) where.status = status;
    if (vertical) where.vertical = vertical;

    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.salary.count({ where }),
    ]);
    return paginated(res, salaries, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch salaries');
  }
};

export const getSalarySummary = async (req: Request, res: Response) => {
  try {
    const [byType, byMonth, totals] = await Promise.all([
      prisma.salary.groupBy({ by: ['employeeType'], _sum: { amount: true }, _count: true }),
      prisma.salary.groupBy({ by: ['month'], _sum: { amount: true }, _count: true, orderBy: { month: 'desc' }, take: 12 }),
      prisma.salary.aggregate({ _sum: { amount: true }, _count: true }),
    ]);
    return success(res, { byType, byMonth, totals });
  } catch (err) {
    return error(res, 'Failed to get salary summary');
  }
};

/**
 * PATCH /api/finance/salaries/:id/pay
 * ATOMIC TRANSACTION: All 3 operations happen together or none do.
 *   1. Update Salary status → PAID
 *   2. Create SALARY entry in the Transaction ledger
 *   3. Write to AuditLog
 */
export const markSalaryPaid = async (req: Request | any, res: Response) => {
  try {
    const existing = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Salary record not found', 404);
    if (existing.status === 'PAID') return error(res, 'Already marked as paid', 400);

    const salary = await prisma.$transaction(async (tx) => {
      // 1. Update salary status
      const updated = await tx.salary.update({
        where: { id: req.params.id },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          reference: req.body.reference || null,
        },
      });

      // 2. Write to the central Transaction ledger
      await tx.transaction.create({
        data: {
          transactionType: 'SALARY',
          source: existing.vertical || 'SECRETARIAT',
          amount: existing.amount || 0,
          description: `Salary: ${existing.employeeName} (${existing.employeeType}) - ${existing.month}`,
          status: 'SUCCESS',
          userId: req.user.id,
        },
      });

      // 3. Write to AuditLog
      await tx.auditLog.create({
        data: {
          action: 'SALARY_PAID',
          entity: 'Salary',
          entityId: existing.id,
          details: JSON.stringify({
            employeeName: existing.employeeName,
            employeeType: existing.employeeType,
            netPaid: existing.amount,
            pfAmount: existing.pfAmount,
            tdsAmount: existing.tdsAmount,
            month: existing.month,
          }),
          performedBy: req.user.id,
        },
      });

      return updated;
    });

    return success(res, salary, 'Salary marked as paid — ledger updated');
  } catch (err) {
    console.error('Mark salary paid error:', err);
    return error(res, 'Failed to update salary');
  }
};
