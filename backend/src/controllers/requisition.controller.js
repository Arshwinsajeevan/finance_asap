const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/response');

/**
 * POST /api/finance/requisitions
 */
const createRequisition = async (req, res) => {
  try {
    const requisition = await prisma.requisition.create({
      data: {
        ...req.body,
        raisedById: req.user.id,
      },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, vertical: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Requisition',
        entityId: requisition.id,
        details: JSON.stringify(req.body),
        performedBy: req.user.id,
      },
    });

    return success(res, requisition, 'Requisition submitted successfully', 201);
  } catch (err) {
    console.error('Create requisition error:', err);
    return error(res, 'Failed to create requisition');
  }
};

/**
 * GET /api/finance/requisitions
 */
const getRequisitions = async (req, res) => {
  try {
    const { page = 1, limit = 20, vertical, status, financialYear } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (vertical) where.vertical = vertical;
    if (status) where.status = status;
    if (financialYear) where.financialYear = financialYear;

    // Vertical users can only see their own requisitions
    if (req.user.role === 'VERTICAL_USER') {
      where.raisedById = req.user.id;
    }

    const [requisitions, total] = await Promise.all([
      prisma.requisition.findMany({
        where,
        include: {
          raisedBy: { select: { id: true, name: true, email: true, vertical: true } },
          approvedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.requisition.count({ where }),
    ]);

    return paginated(res, requisitions, total, page, limit, 'Requisitions retrieved');
  } catch (err) {
    console.error('Get requisitions error:', err);
    return error(res, 'Failed to fetch requisitions');
  }
};

/**
 * GET /api/finance/requisitions/:id
 */
const getRequisition = async (req, res) => {
  try {
    const requisition = await prisma.requisition.findUnique({
      where: { id: req.params.id },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, vertical: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (!requisition) {
      return error(res, 'Requisition not found', 404);
    }

    return success(res, requisition);
  } catch (err) {
    return error(res, 'Failed to fetch requisition');
  }
};

/**
 * PATCH /api/finance/requisitions/:id/approve
 * Atomic: Updates requisition status + writes audit log in a single transaction.
 */
const approveRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.requisition.findUnique({ where: { id } });

    if (!existing) return error(res, 'Requisition not found', 404);
    if (existing.status !== 'PENDING') {
      return error(res, `Cannot approve — current status is ${existing.status}`, 400);
    }

    const approvedAmount = req.body.approvedAmount || existing.amount;

    if (approvedAmount <= 0) {
      return error(res, 'Approved amount must be a positive number', 400);
    }
    if (approvedAmount > existing.amount) {
      return error(res, 'Approved amount cannot exceed the requested amount', 400);
    }

    // --- ATOMIC TRANSACTION: Approve + Audit Log ---
    const requisition = await prisma.$transaction(async (tx) => {
      const updated = await tx.requisition.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAmount,
          approvedById: req.user.id,
        },
        include: {
          raisedBy: { select: { id: true, name: true, vertical: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'APPROVE',
          entity: 'Requisition',
          entityId: id,
          details: JSON.stringify({
            approvedAmount,
            requestedAmount: existing.amount,
            vertical: existing.vertical,
            financialYear: existing.financialYear,
          }),
          performedBy: req.user.id,
        },
      });

      return updated;
    });

    return success(res, requisition, 'Requisition approved successfully');
  } catch (err) {
    console.error('Approve requisition error:', err);
    return error(res, 'Failed to approve requisition');
  }
};

/**
 * PATCH /api/finance/requisitions/:id/reject
 */
const rejectRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.requisition.findUnique({ where: { id } });

    if (!existing) return error(res, 'Requisition not found', 404);
    if (existing.status !== 'PENDING') {
      return error(res, `Cannot reject — current status is ${existing.status}`, 400);
    }

    const requisition = await prisma.requisition.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionNote: req.body.rejectionNote,
        approvedById: req.user.id,
      },
      include: {
        raisedBy: { select: { id: true, name: true, vertical: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'REJECT',
        entity: 'Requisition',
        entityId: id,
        details: JSON.stringify({ rejectionNote: req.body.rejectionNote }),
        performedBy: req.user.id,
      },
    });

    return success(res, requisition, 'Requisition rejected');
  } catch (err) {
    console.error('Reject requisition error:', err);
    return error(res, 'Failed to reject requisition');
  }
};

/**
 * PATCH /api/finance/requisitions/:id/release
 * ATOMIC TRANSACTION: All 4 operations happen together or none do.
 *   1. Update Requisition status → UTILISATION_PENDING
 *   2. Deduct from Vertical Budget (released field)
 *   3. Create FUND_RELEASE entry in the Transaction ledger
 *   4. Write to AuditLog
 */
const releaseFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.requisition.findUnique({ where: { id } });

    if (!existing) return error(res, 'Requisition not found', 404);
    if (existing.status !== 'APPROVED') {
      return error(res, 'Funds can only be released for approved requisitions', 400);
    }

    const releasedAmount = req.body.releasedAmount ?? existing.approvedAmount;

    if (!releasedAmount || releasedAmount <= 0) {
      return error(res, 'Released amount must be a positive number', 400);
    }
    if (releasedAmount > existing.approvedAmount) {
      return error(res, 'Released amount cannot exceed the approved amount', 400);
    }

    // --- ATOMIC TRANSACTION: All 4 writes succeed or all rollback ---
    const requisition = await prisma.$transaction(async (tx) => {

      // 1. Check budget availability INSIDE the transaction to prevent race conditions
      const budget = await tx.budget.findUnique({
        where: {
          vertical_financialYear: {
            vertical: existing.vertical,
            financialYear: existing.financialYear,
          },
        },
      });

      if (!budget) {
        throw new Error(`No budget record found for ${existing.vertical} / ${existing.financialYear}. Create a budget allocation first.`);
      }

      const availableBudget = budget.allocated - budget.released;
      if (availableBudget < releasedAmount) {
        throw new Error(
          `Insufficient budget for ${existing.vertical}. Available: ₹${availableBudget.toLocaleString('en-IN')}, Requested: ₹${releasedAmount.toLocaleString('en-IN')}`
        );
      }

      // 2. Update Requisition status
      const updated = await tx.requisition.update({
        where: { id },
        data: {
          status: 'UTILISATION_PENDING',
          releasedAmount,
        },
        include: {
          raisedBy: { select: { id: true, name: true, vertical: true } },
        },
      });

      // 3. Deduct from the vertical's budget
      await tx.budget.update({
        where: {
          vertical_financialYear: {
            vertical: existing.vertical,
            financialYear: existing.financialYear,
          },
        },
        data: {
          released: { increment: releasedAmount },
          used: { increment: releasedAmount },
        },
      });

      // 4. Write to the central Transaction ledger
      await tx.transaction.create({
        data: {
          transactionType: 'FUND_RELEASE',
          source: existing.vertical,
          amount: releasedAmount,
          description: `Fund release for requisition: ${existing.purpose}`,
          reference: id,
          status: 'SUCCESS',
          userId: req.user.id,
        },
      });

      // 5. Write to the AuditLog
      await tx.auditLog.create({
        data: {
          action: 'FUND_RELEASE',
          entity: 'Requisition',
          entityId: id,
          details: JSON.stringify({
            releasedAmount,
            approvedAmount: existing.approvedAmount,
            vertical: existing.vertical,
            financialYear: existing.financialYear,
            budgetBefore: { allocated: budget.allocated, released: budget.released, used: budget.used },
            budgetAfter: { released: budget.released + releasedAmount, used: budget.used + releasedAmount },
          }),
          performedBy: req.user.id,
        },
      });

      return updated;
    });

    return success(res, requisition, 'Funds released successfully — budget deducted and ledger updated');
  } catch (err) {
    console.error('Release funds error:', err);
    // Surface the specific business-logic error message from inside the transaction
    const message = err.message.startsWith('Insufficient') || err.message.startsWith('No budget')
      ? err.message
      : 'Failed to release funds';
    return error(res, message, 400);
  }
};

module.exports = {
  createRequisition,
  getRequisitions,
  getRequisition,
  approveRequisition,
  rejectRequisition,
  releaseFunds,
};
