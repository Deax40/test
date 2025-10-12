const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCommunHashes() {
  try {
    const tools = await prisma.tool.findMany({
      where: {
        OR: [
          { category: 'Commun Tools' },
          { category: 'COMMUN' }
        ]
      }
    });

    console.log(`Total Commun tools: ${tools.length}\n`);

    const badHashes = tools.filter(t => t.hash && t.hash.includes(' '));

    if (badHashes.length > 0) {
      console.log(`❌ Tools with bad hashes: ${badHashes.length}\n`);
      badHashes.forEach(t => {
        console.log(`  - ${t.name}`);
        console.log(`    Hash: ${t.hash}\n`);
      });
    } else {
      console.log('✅ All Commun tools have valid hashes!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommunHashes();
