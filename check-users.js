const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Checking users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 You need to create a user first.');
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    console.log('💡 Try logging in with one of these usernames.');
    console.log('💡 If you forgot the password, I can reset it for you.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
