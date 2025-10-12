const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const username = 'admin';
    const newPassword = 'admin123';

    console.log(`🔐 Resetting password for user: ${username}\n`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user
    const user = await prisma.user.update({
      where: { username: username },
      data: { passwordHash: passwordHash }
    });

    console.log('✅ Password reset successful!\n');
    console.log('Login credentials:');
    console.log('┌─────────────────────────────┐');
    console.log('│ Username: admin             │');
    console.log('│ Password: admin123          │');
    console.log('│ Role: ADMIN                 │');
    console.log('└─────────────────────────────┘');
    console.log('\n🌐 Go to: https://test-beta-ivory-52.vercel.app/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
