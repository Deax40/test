const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCareHash() {
  try {
    console.log('🔍 Searching for "Capteur pression"...\n');

    const tool = await prisma.tool.findFirst({
      where: {
        name: {
          contains: 'Capteur pression',
          mode: 'insensitive'
        }
      }
    });

    if (!tool) {
      console.log('❌ Tool not found');
      return;
    }

    console.log('✅ Tool found:');
    console.log('ID:', tool.id);
    console.log('Name:', tool.name);
    console.log('Hash:', tool.hash);
    console.log('QR Data:', tool.qrData);
    console.log('Category:', tool.category);
    console.log('\n⚠️ PROBLEM:');
    console.log('If hash is null or equals name, that\'s the issue!');
    console.log('Hash should be a short code like: "C5C4755D" or "43CH002505"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCareHash();
