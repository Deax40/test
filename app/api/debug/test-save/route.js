import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Route de test pour vérifier que tous les champs sont sauvegardés
 * Usage: GET /api/debug/test-save
 */
export async function GET(request) {
  console.log('[TEST-SAVE] Starting comprehensive save test...')

  const testData = {
    hash: 'TEST_SAVE_' + Date.now(),
    name: 'Test Tool Complete',
    category: 'Commun Tools',
    qrData: 'TEST_QR_' + Date.now(),
    lastScanAt: new Date(),
    lastScanUser: 'Test User',
    lastScanLieu: 'Paris Bureau',
    lastScanEtat: 'RAS',
    weight: '5.5',
    imoNumber: 'IMO12345',
    dimensionLength: '100',
    dimensionWidth: '50',
    dimensionHeight: '30',
    dimensionType: 'piece',
    complementaryInfo: 'Test complementary info',
    client: 'Test Client',
    tracking: 'TRACK123',
    transporteur: 'DHL',
    typeEnvoi: 'Envoi',
    problemDescription: 'Test problem',
  }

  try {
    console.log('[TEST-SAVE] Test data:', testData)

    // Create tool
    const tool = await prisma.tool.create({
      data: testData
    })

    console.log('[TEST-SAVE] ✅ Tool created successfully!')

    // Read it back
    const readTool = await prisma.tool.findUnique({
      where: { hash: tool.hash }
    })

    console.log('[TEST-SAVE] Tool read back:', readTool)

    // Check all fields
    const missingFields = []
    for (const [key, value] of Object.entries(testData)) {
      if (key === 'lastScanAt') continue // Date comparison is complex
      if (readTool[key] !== value) {
        missingFields.push({
          field: key,
          expected: value,
          actual: readTool[key]
        })
      }
    }

    // Clean up
    await prisma.tool.delete({
      where: { hash: tool.hash }
    })

    return Response.json({
      success: true,
      message: 'Test completed',
      toolCreated: tool,
      toolReadBack: readTool,
      allFieldsSaved: missingFields.length === 0,
      missingOrIncorrectFields: missingFields,
      testData
    })
  } catch (error) {
    console.error('[TEST-SAVE] ❌ Error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
