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

    const requisition = await prisma.requisition.update({
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

    await prisma.auditLog.create({
      data: {
        action: 'APPROVE',
        entity: 'Requisition',
        entityId: id,
        details: JSON.stringify({ approvedAmount }),
        performedBy: req.user.id,
      },
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
 */
const releaseFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.requisition.findUnique({ where: { id } });

    if (!existing) return error(res, 'Requisition not found', 404);
    if (existing.status !== 'APPROVED') {
      return error(res, 'Funds can only be released for approved requisitions', 400);
    }

    const { releasedAmount } = req.body;
    if (releasedAmount > existing.approvedAmount) {
      return error(res, 'Released amount cannot exceed approved amount', 400);
    }

    // Check budget
    const budget = await prisma.budget.findUnique({
      where: {
        vertical_financialYear: {
          vertical: existing.vertical,
          financialYear: existing.financialYear,
        },
      },
    });
    
    const available = budget ? budget.allocated - budget.released : 0;
    if (available < releasedAmount) {
      return error(res, 'Insufficient budget', 400);
    }

    const requisition = await prisma.requisition.update({
      where: { id },
      data: {
        status: 'UTILISATION_PENDING',
        releasedAmount,
      },
      include: {
        raisedBy: { select: { id: true, name: true, vertical: true } },
      },
    });

    // Update budget — mark as released
    await prisma.budget.update({
      where: {
        vertical_financialYear: {
          vertical: existing.vertical,
          financialYear: existing.financialYear,
        },
      },
      data: {
        released: { increment: releasedAmount },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transactionType: 'FUND_RELEASE',
        source: existing.vertical,
        amount: releasedAmount,
        description: `Fund release for requisition: ${existing.purpose}`,
        reference: id,
        status: 'SUCCESS',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Requisition',
        entityId: id,
        details: JSON.stringify({ releasedAmount, action: 'FUNDS_RELEASED_UTILISATION_PENDING' }),
        performedBy: req.user.id,
      },
    });

    return success(res, requisition, 'Funds released successfully');
  } catch (err) {
    console.error('Release funds error:', err);
    return error(res, 'Failed to release funds');
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
