const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function migrateCareTools() {
  try {
    console.log('🔄 Migrating Care tools to Prisma database...\n');

    const careToolsDir = path.join(process.cwd(), 'Care Tools');

    // Check if directory exists
    if (!fs.existsSync(careToolsDir)) {
      console.log('⚠️  Care Tools directory not found');
      console.log('📁 Looking for tools in database instead...\n');

      // Count existing tools in database
      const count = await prisma.tool.count({
        where: { category: 'Care Tools' }
      });
      console.log(`✅ Found ${count} Care tools already in database`);

      if (count === 0) {
        console.log('\n⚠️  No Care tools found. Please:');
        console.log('1. Add .bs files to "Care Tools" folder, OR');
        console.log('2. Create tools manually via admin panel');
      }

      return;
    }

    // Read all .bs files
    const files = fs.readdirSync(careToolsDir).filter(f => f.endsWith('.bs'));
    console.log(`📦 Found ${files.length} .bs files in Care Tools folder\n`);

    let migrated = 0;
    let skipped = 0;

    for (const file of files) {
      const filePath = path.join(careToolsDir, file);
      const stats = fs.statSync(filePath);
      const toolName = path.basename(file, '.bs');
      const hash = crypto.createHash('md5').update(file).digest('hex').substring(0, 8).toUpperCase();
      const qrData = `CARE_${hash}`;

      // Check if tool already exists
      const existing = await prisma.tool.findUnique({
        where: { hash }
      });

      if (existing) {
        console.log(`⏭️  ${toolName} (${hash}) - Already exists`);
        skipped++;
        continue;
      }

      // Create tool in database
      await prisma.tool.create({
        data: {
          hash,
          name: toolName,
          category: 'Care Tools',
          qrData,
          fileName: file,
          filePath: filePath,
          fileSize: stats.size,
          fileExtension: '.bs',
          lastScanEtat: 'RAS',
          createdAt: stats.birthtime
        }
      });

      console.log(`✅ ${toolName} (${hash}) - Migrated`);
      migrated++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped (already exist): ${skipped}`);
    console.log(`   📊 Total in database: ${migrated + skipped}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCareTools();
