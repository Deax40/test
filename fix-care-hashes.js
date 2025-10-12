const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCareHashes() {
  try {
    console.log('🔧 Fixing Care tool hashes...\n');

    // Get all Care tools with bad hashes (hash = name)
    const tools = await prisma.tool.findMany({
      where: {
        category: 'CARE',
        hash: {
          contains: 'Care ',  // Hash shouldn't contain "Care "
        }
      }
    });

    console.log(`Found ${tools.length} tools with bad hashes\n`);

    for (const tool of tools) {
      // Extract hash from name
      // Format: "Care Tool Name 43CH002505"
      // We want: "43CH002505"

      const match = tool.name.match(/([A-Z0-9]{8,})$/); // Last 8+ alphanumeric chars

      if (match) {
        const newHash = match[1].toUpperCase();

        console.log(`Fixing: ${tool.name}`);
        console.log(`  Old hash: ${tool.hash}`);
        console.log(`  New hash: ${newHash}`);

        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            hash: newHash,
            qrData: `CARE_${newHash}`
          }
        });

        console.log(`  ✅ Updated\n`);
      } else {
        console.log(`⚠️ Could not extract hash from: ${tool.name}\n`);
      }
    }

    console.log('✅ Done! All hashes fixed.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCareHashes();
