const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'finance@asapkerala.gov.in' }
  });
  console.log('User found:', JSON.stringify(user, null, 2));
  process.exit(0);
}

check();
