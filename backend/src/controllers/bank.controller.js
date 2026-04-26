const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/response');

const createBankRecord = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);

    const record = await prisma.bankRecord.create({ data });
    await prisma.auditLog.create({
      data: { action: 'CREATE', entity: 'BankRecord', entityId: record.id, details: JSON.stringify(req.body), performedBy: req.user.id },
    });
    return success(res, record, 'Bank record created', 201);
  } catch (err) {
    return error(res, 'Failed to create bank record');
  }
};

const getBankRecords = async (req, res) => {
  try {
    const { page = 1, limit = 20, entryType, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (entryType) where.entryType = entryType;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.bankRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.bankRecord.count({ where }),
    ]);
    return paginated(res, records, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch bank records');
  }
};

const getGuarantees = async (req, res) => {
  try {
    const records = await prisma.bankRecord.findMany({
      where: { entryType: { in: ['EMD', 'BANK_GUARANTEE'] } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, records);
  } catch (err) {
    return error(res, 'Failed to fetch guarantees');
  }
};

module.exports = { createBankRecord, getBankRecords, getGuarantees };
