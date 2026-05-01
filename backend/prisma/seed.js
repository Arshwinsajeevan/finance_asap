const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MASS DATA Seed...');
  console.log('⏳ Please wait, this might take 10-15 seconds...\n');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.studentPayment.deleteMany();
  await prisma.bankRecord.deleteMany();
  await prisma.donorFund.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.utilisation.deleteMany();
  await prisma.requisition.deleteMany();
  await prisma.transaction.deleteMany();
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

  console.log('✅ Base Users created');

  // ─── Budgets ─────────────────────────────────────────────
  const verticals = ['TRAINING', 'CSP', 'SDC', 'FUND_RAISING', 'TBB', 'SECRETARIAT'];
  const budgetAllocations = [50000000, 35000000, 28000000, 15000000, 20000000, 40000000];

  for (let i = 0; i < verticals.length; i++) {
    const allocated = budgetAllocations[i];
    // Randomize used amount between 40% and 95% to trigger some dashboard warnings
    const usedPercent = 0.4 + (Math.random() * 0.55); 
    
    await prisma.budget.create({
      data: {
        vertical: verticals[i],
        financialYear: '2025-26',
        allocated: allocated,
        used: Math.round(allocated * usedPercent),
        released: Math.round(allocated * (usedPercent - 0.1)),
      },
    });
  }
  console.log('✅ Budgets created with realistic utilization');

  // ─── Requisitions (To populate Pending Approvals widget) ───
  const requisitions = [];
  for (let i = 0; i < 45; i++) {
    const status = i < 15 ? 'PENDING' : (i < 30 ? 'APPROVED' : 'FUNDS_RELEASED');
    const reqAmount = 50000 + Math.round(Math.random() * 200000);
    
    const requisition = await prisma.requisition.create({
      data: {
        vertical: verticals[Math.floor(Math.random() * verticals.length)],
        amount: reqAmount,
        approvedAmount: status !== 'PENDING' ? reqAmount : null,
        releasedAmount: status === 'FUNDS_RELEASED' ? reqAmount : null,
        purpose: 'Routine Operations',
        financialYear: '2025-26',
        status: status,
        raisedById: trainingUser.id,
      },
    });
    requisitions.push(requisition);
  }
  console.log('✅ 45 Requisitions created (15 Pending, 15 Approved, 15 Released)');

  // ─── Utilisations ────────────────────────────────────────
  for (let i = 0; i < 15; i++) {
    const releasedReq = requisitions[30 + i]; // Get the ones that are FUNDS_RELEASED
    await prisma.utilisation.create({
      data: {
        requisitionId: releasedReq.id,
        vertical: releasedReq.vertical,
        amount: releasedReq.releasedAmount - 5000,
        description: 'Utilisation report for equipment and travel.',
        proofFileUrl: 'https://example.com/receipt.pdf',
        status: i < 5 ? 'VERIFIED' : 'PENDING',
        submittedById: trainingUser.id,
      },
    });
    if (i < 5) {
      // Update req status to COMPLETED if utilisation is verified
      await prisma.requisition.update({
        where: { id: releasedReq.id },
        data: { status: 'COMPLETED' }
      });
    }
  }
  console.log('✅ 15 Utilisations created (10 Pending, 5 Verified)');

  // ─── Donor Funds ─────────────────────────────────────────
  const donors = [
    { donorName: 'Infosys Foundation', donorType: 'CORPORATE', amount: 2500000, vertical: 'TRAINING', project: 'AI Skilling Program' },
    { donorName: 'Kerala Govt Grant', donorType: 'GOVERNMENT', amount: 10000000, vertical: 'SDC' },
    { donorName: 'Rajan Menon', donorType: 'INDIVIDUAL', amount: 100000, vertical: 'FUND_RAISING', purpose: 'Scholarship Fund' },
    { donorName: 'TCS CSR', donorType: 'CORPORATE', amount: 5000000, vertical: 'CSP' },
    { donorName: 'World Bank Education', donorType: 'FOREIGN', amount: 15000000, vertical: 'SECRETARIAT' },
  ];
  for (const d of donors) {
    await prisma.donorFund.create({ data: d });
  }
  console.log('✅ 5 Donor funds created');

  // ─── Bank Records ────────────────────────────────────────
  await prisma.bankRecord.create({
    data: { entryType: 'EMD', bankName: 'SBI', amount: 500000, description: 'EMD for IT Infrastructure Tender', reference: 'TND-2025-042', status: 'ACTIVE', validUntil: new Date('2026-12-31') },
  });
  await prisma.bankRecord.create({
    data: { entryType: 'BANK_GUARANTEE', bankName: 'Federal Bank', amount: 1000000, description: 'BG for campus construction', reference: 'BG-2025-007', status: 'ACTIVE', validFrom: new Date('2025-04-01'), validUntil: new Date('2027-03-31') },
  });
  await prisma.bankRecord.create({
    data: { entryType: 'FIXED_DEPOSIT', bankName: 'HDFC', amount: 5000000, description: 'Reserve Fund', reference: 'FD-2025-001', status: 'ACTIVE', validUntil: new Date('2028-12-31') },
  });
  console.log('✅ 3 Bank records created');

  // ─── Salaries ────────────────────────────────────────────
  const empTypes = ['EMPLOYEE', 'TRAINER', 'MENTOR', 'AGENT'];
  for (let i = 0; i < 20; i++) {
    await prisma.salary.create({
      data: {
        employeeType: empTypes[i % empTypes.length],
        employeeName: `Staff Member ${i+1}`,
        vertical: verticals[i % verticals.length],
        amount: 25000 + Math.round(Math.random() * 50000),
        month: '2026-04',
        status: i < 15 ? 'PAID' : 'PENDING',
        paymentDate: i < 15 ? new Date() : null,
      },
    });
  }
  console.log('✅ 20 Salaries created');

  // ─── Student Payments ────────────────────────────────────
  for (let i = 0; i < 20; i++) {
    await prisma.studentPayment.create({
      data: { 
        studentId: student.id, 
        courseName: 'Advanced UI/UX Design', 
        totalFee: 25000, 
        paidAmount: i < 10 ? 25000 : 15000, 
        paymentType: i < 10 ? 'FULL' : 'INSTALLMENT', 
        status: i < 10 ? 'COMPLETED' : 'PARTIAL', 
        paidAt: new Date() 
      },
    });
  }
  console.log('✅ 20 Student payments created');

  // ─── 8,000 Mass Transactions ─────────────────────────────
  console.log('🔄 Generating 8,000 Transactions in memory...');
  const transactionsData = [];
  const now = new Date();
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;

  // Helper to generate a random date within the last year
  const getRandomDate = () => new Date(now.getTime() - Math.random() * oneYearInMs);

  // 5,000 Student Fees (Income: 5k - 20k)
  for (let i = 0; i < 5000; i++) {
    transactionsData.push({
      transactionType: 'STUDENT_PAYMENT',
      source: 'TRAINING',
      amount: 5000 + Math.round(Math.random() * 15000),
      status: 'SUCCESS',
      createdAt: getRandomDate(),
    });
  }

  // 500 Donor Funds (Income: 50k - 5L)
  for (let i = 0; i < 500; i++) {
    transactionsData.push({
      transactionType: 'DONOR_FUND',
      source: 'FUND_RAISING',
      amount: 50000 + Math.round(Math.random() * 450000),
      status: 'SUCCESS',
      createdAt: getRandomDate(),
    });
  }

  // 2,000 Salaries (Expense: 20k - 80k)
  for (let i = 0; i < 2000; i++) {
    transactionsData.push({
      transactionType: 'SALARY',
      source: 'SECRETARIAT',
      amount: 20000 + Math.round(Math.random() * 60000),
      status: 'SUCCESS',
      createdAt: getRandomDate(),
    });
  }

  // 500 Fund Releases (Expense: 1L - 5L)
  for (let i = 0; i < 500; i++) {
    transactionsData.push({
      transactionType: 'FUND_RELEASE',
      source: verticals[Math.floor(Math.random() * verticals.length)],
      amount: 100000 + Math.round(Math.random() * 400000),
      status: 'SUCCESS',
      createdAt: getRandomDate(),
    });
  }

  console.log('🚀 Pushing 8,000 records to database via createMany...');
  
  // createMany is highly optimized and executes in a single bulk query
  await prisma.transaction.createMany({
    data: transactionsData,
  });
  
  console.log('✅ 8,000 Transactions successfully inserted!');

  console.log('\n🎉 MASS SEED COMPLETE! Go check your dashboard.\n');
  console.log('Login credentials (all passwords: password123):');
  console.log('  Finance Officer: finance@asapkerala.gov.in');
  console.log('  Admin: admin@asapkerala.gov.in');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
