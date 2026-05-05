import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';

/**
 * GET /api/finance/petty-cash/accounts
 */
export const getAccounts = async (req: Request | any, res: Response) => {
  try {
    const where: any = {};
    if (req.user.role === 'VERTICAL_USER') {
      if (!req.user.vertical) return error(res, 'User has no assigned vertical', 400);
      where.vertical = req.user.vertical;
    }

    const accounts = await prisma.pettyCashAccount.findMany({
      where,
      orderBy: { vertical: 'asc' },
    });

    return success(res, accounts, 'Petty Cash accounts fetched successfully');
  } catch (err) {
    console.error('getAccounts error:', err);
    return error(res, 'Failed to fetch accounts');
  }
};

/**
 * GET /api/finance/petty-cash/vouchers
 */
export const getVouchers = async (req: Request | any, res: Response) => {
  try {
    const { status, vertical } = req.query as any;
    const where: any = {};

    if (status) where.status = status;

    if (req.user.role === 'VERTICAL_USER') {
      where.account = { vertical: req.user.vertical };
    } else if (vertical) {
      where.account = { vertical };
    }

    const vouchers = await prisma.pettyCashVoucher.findMany({
      where,
      include: {
        account: { select: { vertical: true } },
        submittedBy: { select: { name: true, vertical: true } },
        verifiedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, vouchers, 'Vouchers fetched successfully');
  } catch (err) {
    console.error('getVouchers error:', err);
    return error(res, 'Failed to fetch vouchers');
  }
};

/**
 * POST /api/finance/petty-cash/advance
 * Finance issues/replenishes advance cash to a vertical
 */
export const issueAdvance = async (req: Request | any, res: Response) => {
  try {
    const { vertical, amount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Find or create account
      const account = await tx.pettyCashAccount.upsert({
        where: { vertical },
        update: {
          balance: { increment: amount },
          allottedAmount: { increment: amount },
          lastReplenishedAt: new Date(),
        },
        create: {
          vertical,
          balance: amount,
          allottedAmount: amount,
          lastReplenishedAt: new Date(),
        },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionType: 'PETTY_CASH_ADVANCE',
          source: vertical,
          amount,
          description: `Petty Cash advance to ${vertical}`,
          status: 'SUCCESS',
          userId: req.user.id,
        },
      });

      return { account, transaction };
    });

    return success(res, result.account, 'Advance issued successfully', 200);
  } catch (err) {
    console.error('issueAdvance error:', err);
    return error(res, 'Failed to issue advance');
  }
};

/**
 * POST /api/finance/petty-cash/vouchers
 * Vertical submits a voucher
 */
export const submitVoucher = async (req: Request | any, res: Response) => {
  try {
    const { amount, purpose, date, documentUrl } = req.body;
    const vertical = req.user.vertical;

    if (!vertical) {
      return error(res, 'User has no assigned vertical', 400);
    }

    let account = await prisma.pettyCashAccount.findUnique({
      where: { vertical },
    });

    if (!account) {
      return error(res, 'Petty cash account not found for this vertical. Please request an advance first.', 404);
    }

    const voucher = await prisma.pettyCashVoucher.create({
      data: {
        accountId: account.id,
        amount,
        purpose,
        date: date ? new Date(date) : new Date(),
        documentUrl,
        status: 'PENDING',
        submittedById: req.user.id,
      },
      include: {
        submittedBy: { select: { name: true } },
      },
    });

    return success(res, voucher, 'Voucher submitted successfully', 201);
  } catch (err) {
    console.error('submitVoucher error:', err);
    return error(res, 'Failed to submit voucher');
  }
};

/**
 * PATCH /api/finance/petty-cash/vouchers/:id/action
 * Finance approves or rejects
 */
export const actionVoucher = async (req: Request | any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    const existing = await prisma.pettyCashVoucher.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!existing) {
      return error(res, 'Voucher not found', 404);
    }

    if (existing.status !== 'PENDING') {
      return error(res, `Voucher is already ${existing.status}`, 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.pettyCashVoucher.update({
        where: { id },
        data: {
          status,
          rejectionNote: status === 'REJECTED' ? rejectionNote : null,
          verifiedById: req.user.id,
        },
      });

      if (status === 'APPROVED') {
        // Deduct from petty cash balance
        await tx.pettyCashAccount.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: existing.amount } },
        });

        // Record expense transaction
        await tx.transaction.create({
          data: {
            transactionType: 'PETTY_CASH_EXPENSE',
            source: existing.account.vertical,
            amount: existing.amount,
            description: `Petty Cash expense: ${existing.purpose}`,
            status: 'SUCCESS',
            userId: req.user.id,
          },
        });
      }

      return voucher;
    });

    return success(res, result, `Voucher ${status.toLowerCase()} successfully`);
  } catch (err) {
    console.error('actionVoucher error:', err);
    return error(res, 'Failed to process voucher action');
  }
};
