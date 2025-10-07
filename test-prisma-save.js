const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaSave() {
  try {
    console.log('🔍 Testing Prisma connection and save...\n');

    // Test 1: Connection
    console.log('Test 1: Database connection');
    const userCount = await prisma.user.count();
    console.log('✅ Connected! Users:', userCount);

    // Test 2: Upsert a test tool
    console.log('\nTest 2: Upsert a Care tool');
    const testHash = 'TEST1234';
    const result = await prisma.tool.upsert({
      where: { hash: testHash },
      update: {
        lastScanAt: new Date(),
        lastScanUser: 'Test User',
        lastScanLieu: 'Test Location',
        lastScanEtat: 'RAS'
      },
      create: {
        hash: testHash,
        name: 'Test Tool',
        category: 'Care Tools',
        qrData: `CARE_${testHash}`,
        lastScanAt: new Date(),
        lastScanUser: 'Test User',
        lastScanLieu: 'Test Location',
        lastScanEtat: 'RAS'
      }
    });
    console.log('✅ Tool upserted:', result.id, result.name);

    // Test 3: Create a log entry
    console.log('\nTest 3: Create a log entry');
    const logResult = await prisma.log.create({
      data: {
        qrData: 'test-hash-123',
        lieu: 'Test Location',
        date: new Date(),
        actorName: 'Test User',
        etat: 'RAS',
        probleme: null,
        photo: null,
        photoType: null
      }
    });
    console.log('✅ Log created:', logResult.id);

    // Test 4: Read back the data
    console.log('\nTest 4: Read back saved data');
    const savedTool = await prisma.tool.findUnique({
      where: { hash: testHash }
    });
    console.log('✅ Tool retrieved:', {
      name: savedTool.name,
      lastScanUser: savedTool.lastScanUser,
      lastScanLieu: savedTool.lastScanLieu,
      lastScanEtat: savedTool.lastScanEtat
    });

    console.log('\n🎉 All tests passed! Prisma is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaSave();
