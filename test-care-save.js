const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCareSave() {
  try {
    console.log('🧪 Testing Care tool save...\n');

    const testHash = 'C5C4755D'; // Caisse Matériel EVERQ

    // Simulate a scan update
    const updateData = {
      lastScanAt: new Date(),
      lastScanUser: 'Test User',
      lastScanLieu: 'Paris Bureau',
      lastScanEtat: 'Bon état',
      problemDescription: null,
    };

    console.log('📝 Update data:', updateData);

    const tool = await prisma.tool.upsert({
      where: { hash: testHash },
      update: updateData,
      create: {
        hash: testHash,
        name: 'Test Tool',
        category: 'Care Tools',
        qrData: `CARE_${testHash}`,
        ...updateData,
      },
    });

    console.log('\n✅ Save successful!');
    console.log('Tool:', {
      id: tool.id,
      name: tool.name,
      lastScanUser: tool.lastScanUser,
      lastScanLieu: tool.lastScanLieu,
      lastScanEtat: tool.lastScanEtat,
      lastScanAt: tool.lastScanAt
    });

    // Verify the save by reading back
    const saved = await prisma.tool.findUnique({
      where: { hash: testHash }
    });

    console.log('\n✅ Verification: Tool retrieved from database');
    console.log('Saved data matches:',
      saved.lastScanUser === updateData.lastScanUser &&
      saved.lastScanLieu === updateData.lastScanLieu &&
      saved.lastScanEtat === updateData.lastScanEtat
    );

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCareSave();
