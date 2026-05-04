const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function drop() {
  await prisma.$executeRaw`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;`;
  console.log('Constraint users_role_check dropped');
  process.exit(0);
}

drop();
