import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Test COMPLET: Créer → Modifier → Relire
 * Usage: GET /api/debug/test-full-cycle
 */
export async function GET(request) {
  const testHash = 'TEST_CYCLE_' + Date.now()
  let createdTool = null

  try {
    console.log('[TEST-CYCLE] ========== STARTING FULL CYCLE TEST ==========')

    // ÉTAPE 1: Créer un outil
    console.log('[TEST-CYCLE] Step 1: Creating tool...')
    createdTool = await prisma.tool.create({
      data: {
        hash: testHash,
        name: 'Test Tool Full Cycle',
        category: 'CARE',
        qrData: 'TEST_QR_' + Date.now(),
        lastScanUser: 'Test User',
        lastScanLieu: 'Paris Bureau',
        lastScanEtat: 'RAS',
      }
    })
    console.log('[TEST-CYCLE] ✅ Tool created:', createdTool.id)

    // ÉTAPE 2: Le modifier avec TOUS les champs
    console.log('[TEST-CYCLE] Step 2: Updating with ALL fields...')
    const updateData = {
      weight: '10.5',
      imoNumber: 'IMO99999',
      dimensionLength: '150',
      dimensionWidth: '80',
      dimensionHeight: '60',
      dimensionType: 'piece',
      complementaryInfo: 'Info complémentaire test',
      client: 'Test Client SA',
      tracking: 'TRACK999',
      transporteur: 'FedEx',
      typeEnvoi: 'Envoi',
      lastScanLieu: 'Gleizé Bureau',
      lastScanEtat: 'RAS',
    }

    console.log('[TEST-CYCLE] Update data:', JSON.stringify(updateData, null, 2))

    const updatedTool = await prisma.tool.update({
      where: { hash: testHash },
      data: updateData
    })
    console.log('[TEST-CYCLE] ✅ Tool updated')

    // ÉTAPE 3: Le relire
    console.log('[TEST-CYCLE] Step 3: Reading back...')
    const readTool = await prisma.tool.findUnique({
      where: { hash: testHash }
    })
    console.log('[TEST-CYCLE] ✅ Tool read back')

    // ÉTAPE 4: Vérifier tous les champs
    console.log('[TEST-CYCLE] Step 4: Verifying fields...')
    const missingOrWrong = []

    for (const [key, expectedValue] of Object.entries(updateData)) {
      const actualValue = readTool[key]
      if (actualValue !== expectedValue) {
        missingOrWrong.push({
          field: key,
          expected: expectedValue,
          actual: actualValue,
          matches: actualValue === expectedValue
        })
      }
    }

    // ÉTAPE 5: Nettoyer
    await prisma.tool.delete({
      where: { hash: testHash }
    })
    console.log('[TEST-CYCLE] ✅ Test tool deleted')

    console.log('[TEST-CYCLE] ========== TEST COMPLETED ==========')

    return Response.json({
      success: true,
      testPassed: missingOrWrong.length === 0,
      steps: {
        step1_create: '✅ Created',
        step2_update: '✅ Updated',
        step3_read: '✅ Read back',
        step4_verify: missingOrWrong.length === 0 ? '✅ All fields match' : '❌ Some fields missing/wrong',
        step5_cleanup: '✅ Deleted'
      },
      fieldsChecked: Object.keys(updateData).length,
      fieldsCorrect: Object.keys(updateData).length - missingOrWrong.length,
      fieldsWrong: missingOrWrong.length,
      wrongFields: missingOrWrong,
      createdToolData: createdTool,
      updateDataSent: updateData,
      toolAfterUpdate: readTool
    })

  } catch (error) {
    // Cleanup en cas d'erreur
    if (createdTool) {
      try {
        await prisma.tool.delete({ where: { hash: testHash } })
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    console.error('[TEST-CYCLE] ❌ Error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      code: error.code
    }, { status: 500 })
  }
}
