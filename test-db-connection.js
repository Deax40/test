const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const userCount = await prisma.user.count();
    const toolCount = await prisma.tool.count();
    const logCount = await prisma.log.count();

    console.log('✅ Connexion à la base de données réussie!');
    console.log(`📊 Statistiques:`);
    console.log(`   - Utilisateurs: ${userCount}`);
    console.log(`   - Outils (Care): ${toolCount}`);
    console.log(`   - Logs: ${logCount}`);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
