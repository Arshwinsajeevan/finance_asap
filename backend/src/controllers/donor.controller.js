const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/response');

const createDonorFund = async (req, res) => {
  try {
    const fund = await prisma.$transaction(async (tx) => {
      const donor = await tx.donorFund.create({ data: req.body });

      await tx.transaction.create({
        data: {
          transactionType: 'DONOR_FUND',
          source: req.body.vertical || 'FUND_RAISING',
          amount: req.body.amount,
          description: `Donor: ${req.body.donorName} - ${req.body.purpose || 'General'}`,
          status: 'SUCCESS',
          userId: req.user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'DonorFund',
          entityId: donor.id,
          details: JSON.stringify(req.body),
          performedBy: req.user.id,
        },
      });

      return donor;
    });

    return success(res, fund, 'Donor fund recorded', 201);
  } catch (err) {
    console.error('Create donor fund error:', err);
    return error(res, 'Failed to record donor fund');
  }
};

const getDonorFunds = async (req, res) => {
  try {
    const { page = 1, limit = 20, donorType, vertical } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (donorType) where.donorType = donorType;
    if (vertical) where.vertical = vertical;

    const [funds, total] = await Promise.all([
      prisma.donorFund.findMany({ where, orderBy: { receivedAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.donorFund.count({ where }),
    ]);
    return paginated(res, funds, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch donor funds');
  }
};

const getDonorSummary = async (req, res) => {
  try {
    const [byType, byVertical, totals] = await Promise.all([
      prisma.donorFund.groupBy({ by: ['donorType'], _sum: { amount: true }, _count: true }),
      prisma.donorFund.groupBy({ by: ['vertical'], _sum: { amount: true }, _count: true }),
      prisma.donorFund.aggregate({ _sum: { amount: true }, _count: true }),
    ]);
    return success(res, { byType, byVertical, totals });
  } catch (err) {
    return error(res, 'Failed to get donor summary');
  }
};

module.exports = { createDonorFund, getDonorFunds, getDonorSummary };
