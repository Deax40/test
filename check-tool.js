const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTool() {
  const hash = '869C23B8BC177DF3'; // Le hash de l'erreur 404
  const tool = await prisma.tool.findUnique({
    where: { hash }
  });

  if (tool) {
    console.log('✅ Tool found:', tool.name, tool.hash);
  } else {
    console.log('❌ Tool NOT found with hash:', hash);
    console.log('\n📦 Searching in migrated tools...');
    const allTools = await prisma.tool.findMany({
      where: { category: 'Care Tools' },
      select: { hash: true, name: true }
    });
    console.log(`Found ${allTools.length} Care tools:`);
    allTools.forEach(t => console.log(`  - ${t.name} (${t.hash})`));
  }

  await prisma.$disconnect();
}

checkTool();
