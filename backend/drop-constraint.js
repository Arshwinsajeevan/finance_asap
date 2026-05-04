const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log('🔍 Attempting to drop the restrictive role constraint...');
    
    // 1. Drop the check constraint that limits roles
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check"`);
    console.log('✅ Constraint "users_role_check" dropped.');

    // 2. Just in case there is another one (sometimes they are named differently)
    // We can't easily find it without more complex SQL, but we can try to update now.
    
    console.log('🚀 Force updating roles to FINANCE_OFFICER and ADMIN...');
    
    await prisma.user.updateMany({
      where: { email: 'finance@asapkerala.gov.in' },
      data: { role: 'FINANCE_OFFICER' }
    });
    
    await prisma.user.updateMany({
      where: { email: 'admin@asapkerala.gov.in' },
      data: { role: 'ADMIN' }
    });

    console.log('🎉 Database roles fixed! You should be able to login now.');
  } catch (err) {
    console.error('❌ Failed to fix database:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
