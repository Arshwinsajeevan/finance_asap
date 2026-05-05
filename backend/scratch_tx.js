const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.requisition.updateMany({
    data: { documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
  });
  console.log("Updated ALL requisitions with sample PDF URLs.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
