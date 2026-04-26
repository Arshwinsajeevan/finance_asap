const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/response');

const createSalary = async (req, res) => {
  try {
    const salary = await prisma.salary.create({ data: req.body });
    await prisma.auditLog.create({
      data: { action: 'CREATE', entity: 'Salary', entityId: salary.id, details: JSON.stringify(req.body), performedBy: req.user.id },
    });
    return success(res, salary, 'Salary record created', 201);
  } catch (err) {
    return error(res, 'Failed to create salary record');
  }
};

const getSalaries = async (req, res) => {
  try {
    const { page = 1, limit = 20, employeeType, month, status, vertical } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
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

const getSalarySummary = async (req, res) => {
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

const markSalaryPaid = async (req, res) => {
  try {
    const existing = await prisma.salary.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Not found', 404);
    if (existing.status === 'PAID') return error(res, 'Already paid', 400);

    const salary = await prisma.salary.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paymentDate: new Date(), reference: req.body.reference || null },
    });

    await prisma.transaction.create({
      data: {
        transactionType: 'SALARY', source: existing.vertical || 'SECRETARIAT', amount: existing.amount,
        description: `Salary: ${existing.employeeName} (${existing.employeeType}) - ${existing.month}`,
        status: 'SUCCESS', userId: existing.userId,
      },
    });
    return success(res, salary, 'Salary marked as paid');
  } catch (err) {
    return error(res, 'Failed to update salary');
  }
};

module.exports = { createSalary, getSalaries, getSalarySummary, markSalaryPaid };
