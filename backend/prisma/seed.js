const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.studentPayment.deleteMany();
  await prisma.bankRecord.deleteMany();
  await prisma.donorFund.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.requisition.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 12);

  // ─── Users ───────────────────────────────────────────────
  const financeOfficer = await prisma.user.create({
    data: { name: 'Arun Kumar', email: 'finance@asapkerala.gov.in', password: hash, role: 'FINANCE_OFFICER' },
  });
  const admin = await prisma.user.create({
    data: { name: 'Meera Nair', email: 'admin@asapkerala.gov.in', password: hash, role: 'ADMIN' },
  });
  const trainingUser = await prisma.user.create({
    data: { name: 'Rahul S', email: 'training@asapkerala.gov.in', password: hash, role: 'VERTICAL_USER', vertical: 'TRAINING' },
  });
  const cspUser = await prisma.user.create({
    data: { name: 'Priya M', email: 'csp@asapkerala.gov.in', password: hash, role: 'VERTICAL_USER', vertical: 'CSP' },
  });
  const student = await prisma.user.create({
    data: { name: 'Athira K', email: 'athira@student.asap.in', password: hash, role: 'STUDENT' },
  });

  console.log('✅ Users created');

  // ─── Budgets ─────────────────────────────────────────────
  const verticals = ['TRAINING', 'CSP', 'SDC', 'FUND_RAISING', 'TBB', 'SECRETARIAT'];
  const budgetAmounts = [5000000, 3500000, 2800000, 1500000, 2000000, 4000000];

  for (let i = 0; i < verticals.length; i++) {
    await prisma.budget.create({
      data: {
        vertical: verticals[i],
        financialYear: '2025-26',
        allocated: budgetAmounts[i],
        used: Math.round(budgetAmounts[i] * (0.2 + Math.random() * 0.4)),
        released: Math.round(budgetAmounts[i] * 0.6),
      },
    });
  }
  console.log('✅ Budgets created');

  // ─── Requisitions ────────────────────────────────────────
  const purposes = ['Annual Training Program', 'Skill Development Workshop', 'Infrastructure Upgrade', 'Digital Marketing Campaign', 'Lab Equipment Purchase'];
  const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'FUNDS_RELEASED', 'PENDING'];

  for (let i = 0; i < 5; i++) {
    await prisma.requisition.create({
      data: {
        vertical: verticals[i % verticals.length],
        amount: 200000 + Math.round(Math.random() * 500000),
        purpose: purposes[i],
        description: `Requisition for ${purposes[i]} in FY 2025-26`,
        financialYear: '2025-26',
        status: statuses[i],
        raisedById: i % 2 === 0 ? trainingUser.id : cspUser.id,
        approvedById: statuses[i] !== 'PENDING' ? financeOfficer.id : null,
        approvedAmount: statuses[i] === 'APPROVED' || statuses[i] === 'FUNDS_RELEASED' ? 200000 + Math.round(Math.random() * 300000) : null,
        releasedAmount: statuses[i] === 'FUNDS_RELEASED' ? 150000 + Math.round(Math.random() * 200000) : null,
      },
    });
  }
  console.log('✅ Requisitions created');

  // ─── Transactions ────────────────────────────────────────
  const txTypes = ['STUDENT_PAYMENT', 'DONOR_FUND', 'SALARY', 'EXPENSE', 'FUND_RELEASE'];
  for (let i = 0; i < 15; i++) {
    await prisma.transaction.create({
      data: {
        transactionType: txTypes[i % txTypes.length],
        source: verticals[i % verticals.length],
        amount: 5000 + Math.round(Math.random() * 200000),
        description: `Sample transaction #${i + 1}`,
        status: Math.random() > 0.1 ? 'SUCCESS' : 'FAILED',
        createdAt: new Date(Date.now() - Math.round(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      },
    });
  }
  console.log('✅ Transactions created');

  // ─── Salaries ────────────────────────────────────────────
  const empTypes = ['EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'];
  const names = ['Deepak R', 'Sana Fathima', 'Vijay Krishnan', 'Lakshmi P', 'Anoop S', 'Reshma B'];
  for (let i = 0; i < 6; i++) {
    await prisma.salary.create({
      data: {
        employeeType: empTypes[i % empTypes.length],
        employeeName: names[i],
        vertical: verticals[i % verticals.length],
        amount: 25000 + Math.round(Math.random() * 50000),
        month: '2026-04',
        status: i < 3 ? 'PAID' : 'PENDING',
        paymentDate: i < 3 ? new Date() : null,
        commission: empTypes[i % empTypes.length] === 'AGENT' ? 500 : null,
      },
    });
  }
  console.log('✅ Salaries created');

  // ─── Donor Funds ─────────────────────────────────────────
  const donors = [
    { donorName: 'Infosys Foundation', donorType: 'CORPORATE', amount: 2500000, vertical: 'TRAINING', project: 'AI Skilling Program' },
    { donorName: 'Kerala Govt Grant', donorType: 'GOVERNMENT', amount: 10000000, vertical: 'SDC' },
    { donorName: 'Rajan Menon', donorType: 'INDIVIDUAL', amount: 100000, vertical: 'FUND_RAISING', purpose: 'Scholarship Fund' },
  ];
  for (const d of donors) {
    await prisma.donorFund.create({ data: d });
  }
  console.log('✅ Donor funds created');

  // ─── Bank Records ────────────────────────────────────────
  await prisma.bankRecord.create({
    data: { entryType: 'EMD', bankName: 'SBI', amount: 500000, description: 'EMD for IT Infrastructure Tender', reference: 'TND-2025-042', status: 'ACTIVE', validUntil: new Date('2026-12-31') },
  });
  await prisma.bankRecord.create({
    data: { entryType: 'BANK_GUARANTEE', bankName: 'Federal Bank', amount: 1000000, description: 'BG for campus construction', reference: 'BG-2025-007', status: 'ACTIVE', validFrom: new Date('2025-04-01'), validUntil: new Date('2027-03-31') },
  });
  console.log('✅ Bank records created');

  // ─── Student Payments ────────────────────────────────────
  await prisma.studentPayment.create({
    data: { studentId: student.id, courseName: 'Data Analytics', totalFee: 25000, paidAmount: 15000, installmentNo: 2, paymentType: 'INSTALLMENT', status: 'PARTIAL', paidAt: new Date() },
  });
  console.log('✅ Student payments created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials (all passwords: password123):');
  console.log('  Finance Officer: finance@asapkerala.gov.in');
  console.log('  Admin: admin@asapkerala.gov.in');
  console.log('  Training (Vertical): training@asapkerala.gov.in');
  console.log('  CSP (Vertical): csp@asapkerala.gov.in');
  console.log('  Student: athira@student.asap.in\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
