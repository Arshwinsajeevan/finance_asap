const prisma = require('../utils/prisma');
const { sendSuccess, sendError } = require('../utils/response');

exports.getUtilisations = async (req, res) => {
  try {
    const { status, requisitionId } = req.query;
    const where = {};
    
    // Vertical users can only see their own utilisations
    if (req.user.role === 'VERTICAL_USER') {
      where.vertical = req.user.vertical;
    }

    if (status) where.status = status;
    if (requisitionId) where.requisitionId = requisitionId;

    const utilisations = await prisma.utilisation.findMany({
      where,
      include: {
        requisition: { select: { purpose: true, releasedAmount: true, status: true } },
        submittedBy: { select: { name: true, email: true } },
        verifiedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    sendSuccess(res, utilisations, 'Utilisations retrieved successfully');
  } catch (error) {
    console.error('Get Utilisations Error:', error);
    sendError(res, 500, 'Failed to fetch utilisations');
  }
};

exports.getUtilisationSummary = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'VERTICAL_USER') {
      where.vertical = req.user.vertical;
    }

    const totals = await prisma.utilisation.aggregate({
      _sum: { amount: true },
      _count: true,
      where
    });

    const byStatus = await prisma.utilisation.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
      where
    });

    sendSuccess(res, { totals, byStatus }, 'Utilisation summary retrieved');
  } catch (error) {
    console.error('Utilisation Summary Error:', error);
    sendError(res, 500, 'Failed to fetch utilisation summary');
  }
};

exports.submitUtilisation = async (req, res) => {
  try {
    const data = req.body;
    
    // Check if requisition exists and belongs to the user's vertical
    const requisition = await prisma.requisition.findUnique({ where: { id: data.requisitionId } });
    if (!requisition) {
      return sendError(res, 404, 'Requisition not found');
    }

    if (req.user.role === 'VERTICAL_USER' && requisition.vertical !== req.user.vertical) {
      return sendError(res, 403, 'You can only submit utilisation for your own vertical');
    }

    if (requisition.status !== 'FUNDS_RELEASED') {
      return sendError(res, 400, 'Cannot submit utilisation for unreleased funds');
    }

    const utilisation = await prisma.utilisation.create({
      data: {
        ...data,
        vertical: requisition.vertical,
        submittedById: req.user.userId
      },
      include: {
        requisition: { select: { purpose: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Utilisation',
        entityId: utilisation.id,
        performedBy: req.user.userId,
        details: JSON.stringify({ amount: data.amount, requisitionId: data.requisitionId })
      }
    });

    sendSuccess(res, utilisation, 'Utilisation submitted successfully', 201);
  } catch (error) {
    console.error('Submit Utilisation Error:', error);
    sendError(res, 500, 'Failed to submit utilisation');
  }
};

exports.verifyUtilisation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    const utilisation = await prisma.utilisation.findUnique({ where: { id } });
    if (!utilisation) return sendError(res, 404, 'Utilisation record not found');
    if (utilisation.status !== 'PENDING') return sendError(res, 400, 'Utilisation is already verified or rejected');

    if (status === 'REJECTED' && !rejectionNote) {
      return sendError(res, 400, 'Rejection note is required');
    }

    const updated = await prisma.utilisation.update({
      where: { id },
      data: {
        status,
        rejectionNote: status === 'REJECTED' ? rejectionNote : null,
        verifiedById: req.user.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Utilisation',
        entityId: id,
        performedBy: req.user.userId,
        details: JSON.stringify({ status, rejectionNote })
      }
    });

    sendSuccess(res, updated, `Utilisation ${status.toLowerCase()} successfully`);
  } catch (error) {
    console.error('Verify Utilisation Error:', error);
    sendError(res, 500, 'Failed to verify utilisation');
  }
};
