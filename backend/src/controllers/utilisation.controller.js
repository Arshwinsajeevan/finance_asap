const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

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

    return success(res, utilisations, 'Utilisations retrieved successfully');
  } catch (err) {
    console.error('Get Utilisations Error:', err);
    return error(res, 'Failed to fetch utilisations');
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

    return success(res, { totals, byStatus }, 'Utilisation summary retrieved');
  } catch (err) {
    console.error('Utilisation Summary Error:', err);
    return error(res, 'Failed to fetch utilisation summary');
  }
};

exports.submitUtilisation = async (req, res) => {
  try {
    const data = req.body;
    
    // Check if requisition exists and belongs to the user's vertical
    const requisition = await prisma.requisition.findUnique({ where: { id: data.requisitionId } });
    if (!requisition) {
      return error(res, 'Requisition not found', 404);
    }

    if (req.user.role === 'VERTICAL_USER' && requisition.vertical !== req.user.vertical) {
      return error(res, 'You can only submit utilisation for your own vertical', 403);
    }

    if (requisition.status !== 'FUNDS_RELEASED') {
      return error(res, 'Cannot submit utilisation for unreleased funds', 400);
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

    return success(res, utilisation, 'Utilisation submitted successfully', 201);
  } catch (err) {
    console.error('Submit Utilisation Error:', err);
    return error(res, 'Failed to submit utilisation');
  }
};

exports.verifyUtilisation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote } = req.body;

    const utilisation = await prisma.utilisation.findUnique({ 
      where: { id },
      include: { requisition: true }
    });
    
    if (!utilisation) return error(res, 'Utilisation record not found', 404);
    if (utilisation.status !== 'PENDING' && utilisation.status !== 'SUBMITTED') {
      return error(res, 'Utilisation is already verified or rejected', 400);
    }

    if (status === 'REJECTED' && !rejectionNote) {
      return error(res, 'Rejection note is required', 400);
    }

    // Validation logic
    if (status === 'APPROVED' || status === 'VERIFIED') {
      if (utilisation.amount > utilisation.requisition.releasedAmount) {
        return error(res, 'Utilisation exceeds released funds', 400);
      }
    }

    const finalStatus = status === 'VERIFIED' ? 'APPROVED' : status;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.utilisation.update({
        where: { id },
        data: {
          status: finalStatus,
          rejectionNote: finalStatus === 'REJECTED' ? rejectionNote : null,
          verifiedById: req.user.id || req.user.userId
        }
      });

      if (finalStatus === 'APPROVED') {
        // Mark requisition as COMPLETED
        await tx.requisition.update({
          where: { id: utilisation.requisitionId },
          data: { status: 'COMPLETED' }
        });

        // Create transaction entry for the expense
        await tx.transaction.create({
          data: {
            transactionType: 'EXPENSE',
            source: utilisation.vertical,
            amount: utilisation.amount,
            description: `Utilisation verified: ${utilisation.description}`,
            reference: utilisation.id,
            status: 'SUCCESS',
            userId: req.user.id || req.user.userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'VERIFY_UTILISATION',
          entity: 'Utilisation',
          entityId: id,
          performedBy: req.user.id || req.user.userId,
          details: JSON.stringify({ status: finalStatus, rejectionNote })
        }
      });

      return u;
    });

    return success(res, updated, `Utilisation ${finalStatus.toLowerCase()} successfully`);
  } catch (err) {
    console.error('Verify Utilisation Error:', err);
    return error(res, 'Failed to verify utilisation');
  }
};
