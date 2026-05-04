const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@asapkerala.gov.in' }
  });
  console.log('Admin found:', JSON.stringify(admin, null, 2));
  process.exit(0);
}

check();
