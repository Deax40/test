const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function fixRemainingHashes() {
  try {
    console.log('🔧 Fixing remaining Care tool hashes...\n');

    // Get all Care tools with bad hashes (hash contains spaces)
    const tools = await prisma.tool.findMany({
      where: {
        category: 'CARE',
        hash: {
          contains: ' ',  // Hash shouldn't contain spaces
        }
      }
    });

    console.log(`Found ${tools.length} tools with bad hashes\n`);

    for (const tool of tools) {
      // Generate hash from name: first 8 chars of MD5
      const md5Hash = crypto.createHash('md5').update(tool.name).digest('hex').substring(0, 8).toUpperCase();

      console.log(`Fixing: ${tool.name}`);
      console.log(`  Old hash: ${tool.hash}`);
      console.log(`  New hash: ${md5Hash}`);

      await prisma.tool.update({
        where: { id: tool.id },
        data: {
          hash: md5Hash,
          qrData: `CARE_${md5Hash}`
        }
      });

      console.log(`  ✅ Updated\n`);
    }

    console.log('✅ Done! All hashes fixed.');

    // Verify
    console.log('\n🔍 Verification:');
    const badHashes = await prisma.tool.count({
      where: {
        category: 'CARE',
        hash: { contains: ' ' }
      }
    });

    console.log(`Tools with bad hashes remaining: ${badHashes}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingHashes();
