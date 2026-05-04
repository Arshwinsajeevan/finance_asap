import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error, paginated } from '../utils/response';

export const createBankRecord = async (req: Request | any, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);

    const record = await prisma.bankRecord.create({ data });
    await prisma.auditLog.create({
      data: { 
        action: 'CREATE', 
        entity: 'BankRecord', 
        entityId: record.id, 
        details: JSON.stringify(req.body), 
        performedBy: req.user.id 
      },
    });
    return success(res, record, 'Bank record created', 201);
  } catch (err) {
    return error(res, 'Failed to create bank record');
  }
};

export const getBankRecords = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, entryType, status } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
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

export const getGuarantees = async (req: Request, res: Response) => {
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
