const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const user = await prisma.user.update({
    where: { email: 'finance@asapkerala.gov.in' },
    data: { role: 'FINANCE_OFFICER' }
  });
  console.log('User role updated to FINANCE_OFFICER');
  process.exit(0);
}

fix();
