const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRaw`
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE contype = 'c';
  `;
  console.log('All Constraints:', JSON.stringify(result, null, 2));
  process.exit(0);
}

check();
