const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// This script fixes Care tool hashes directly on Vercel's database
// Run with: DATABASE_URL=<vercel-url> node deploy-hash-fixes-to-vercel.js

const prisma = new PrismaClient();

async function deployHashFixes() {
  try {
    console.log('🚀 Deploying hash fixes to production database...\n');

    // Get all Care tools with bad hashes (hash contains spaces)
    const tools = await prisma.tool.findMany({
      where: {
        category: 'CARE',
        hash: {
          contains: ' ',  // Hash shouldn't contain spaces
        }
      }
    });

    if (tools.length === 0) {
      console.log('✅ No bad hashes found! All Care tools already have correct hashes.');
      return;
    }

    console.log(`Found ${tools.length} tools with bad hashes\n`);

    for (const tool of tools) {
      // Try to extract hash from end of name
      const match = tool.name.match(/([A-Z0-9]{8,})$/);

      let newHash;
      if (match) {
        newHash = match[1].toUpperCase();
      } else {
        // Generate hash from name: first 8 chars of MD5
        newHash = crypto.createHash('md5').update(tool.name).digest('hex').substring(0, 8).toUpperCase();
      }

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
    }

    console.log('✅ Done! All hashes fixed on production.');

    // Verify
    console.log('\n🔍 Verification:');
    const badHashes = await prisma.tool.count({
      where: {
        category: 'CARE',
        hash: { contains: ' ' }
      }
    });

    console.log(`Tools with bad hashes remaining: ${badHashes}`);

    if (badHashes === 0) {
      console.log('\n🎉 SUCCESS! All Care tools now have valid short hashes!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployHashFixes();
