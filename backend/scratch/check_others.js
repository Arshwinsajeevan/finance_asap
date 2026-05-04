const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'training@asapkerala.gov.in',
          'csp@asapkerala.gov.in',
          'athira@student.asap.in'
        ]
      }
    }
  });
  console.log('Users found:', JSON.stringify(users, null, 2));
  process.exit(0);
}

check();
