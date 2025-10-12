import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseConfigured: !!process.env.DATABASE_URL,
    databaseUrlFormat: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 20)}...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 20)}`
      : 'NOT SET',
  }

  try {
    // Test 1: Simple connection test
    await prisma.$connect()
    diagnostics.connectionTest = '✅ Connected'

    // Test 2: Count users
    const userCount = await prisma.user.count()
    diagnostics.userCount = userCount

    // Test 3: Count tools
    const toolCount = await prisma.tool.count()
    diagnostics.toolCount = toolCount

    // Test 4: Try to read a tool
    const sampleTool = await prisma.tool.findFirst()
    diagnostics.sampleTool = sampleTool ? {
      id: sampleTool.id,
      name: sampleTool.name,
      hash: sampleTool.hash,
    } : 'No tools found'

    // Test 5: Try to create/update a test tool
    const testHash = 'TEST_DIAGNOSTIC'
    const testTool = await prisma.tool.upsert({
      where: { hash: testHash },
      update: {
        lastScanAt: new Date(),
        lastScanUser: 'Diagnostic Test',
        lastScanLieu: 'Test Location',
        lastScanEtat: 'Test',
      },
      create: {
        hash: testHash,
        name: 'Diagnostic Test Tool',
        category: 'Test',
        qrData: `TEST_${testHash}`,
        lastScanAt: new Date(),
        lastScanUser: 'Diagnostic Test',
        lastScanLieu: 'Test Location',
        lastScanEtat: 'Test',
      },
    })

    diagnostics.upsertTest = '✅ UPSERT WORKS'
    diagnostics.testToolId = testTool.id

    // Test 6: Read it back
    const verifyTool = await prisma.tool.findUnique({
      where: { hash: testHash }
    })

    diagnostics.verifyTest = verifyTool ? '✅ READ BACK WORKS' : '❌ READ BACK FAILED'

    diagnostics.overallStatus = '✅ ALL TESTS PASSED'

    return Response.json(diagnostics, { status: 200 })

  } catch (error) {
    diagnostics.error = error.message
    diagnostics.errorCode = error.code
    diagnostics.errorStack = error.stack
    diagnostics.overallStatus = '❌ TESTS FAILED'

    return Response.json(diagnostics, { status: 500 })
  }
}
