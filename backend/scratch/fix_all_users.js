const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAll() {
  await prisma.user.update({
    where: { email: 'training@asapkerala.gov.in' },
    data: { role: 'VERTICAL_USER' }
  });
  await prisma.user.update({
    where: { email: 'csp@asapkerala.gov.in' },
    data: { role: 'VERTICAL_USER' }
  });
  await prisma.user.update({
    where: { email: 'athira@student.asap.in' },
    data: { role: 'STUDENT' }
  });
  console.log('All user roles synchronized with seed data');
  process.exit(0);
}

fixAll();
