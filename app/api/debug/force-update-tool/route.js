import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Force update a specific tool with test data
 * Usage: POST /api/debug/force-update-tool
 * Body: { "hash": "869c23b8bc177df3" }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const hash = String(body.hash).trim().toUpperCase()

    console.log('[FORCE-UPDATE] Updating tool:', hash)

    // Données de test complètes
    const updateData = {
      weight: '25.5',
      imoNumber: 'IMO-TEST-123',
      dimensionLength: '200',
      dimensionWidth: '100',
      dimensionHeight: '75',
      dimensionType: 'piece',
      complementaryInfo: 'FORCE UPDATE - Si vous voyez ceci, la sauvegarde fonctionne!',
      client: 'Client Test Force',
      tracking: 'FORCE-TRACK-999',
      transporteur: 'Transporteur Test',
      typeEnvoi: 'Envoi',
      lastScanLieu: 'TEST - Paris Bureau',
      lastScanEtat: 'RAS',
      lastScanUser: 'Force Update Test',
      lastScanAt: new Date()
    }

    console.log('[FORCE-UPDATE] Data to update:', JSON.stringify(updateData, null, 2))

    const tool = await prisma.tool.update({
      where: { hash },
      data: updateData
    })

    console.log('[FORCE-UPDATE] ✅ Update successful')

    // Relire pour vérifier
    const verify = await prisma.tool.findUnique({
      where: { hash }
    })

    console.log('[FORCE-UPDATE] Verification:', {
      weight: verify.weight,
      imoNumber: verify.imoNumber,
      dimensionLength: verify.dimensionLength,
      complementaryInfo: verify.complementaryInfo
    })

    return Response.json({
      success: true,
      message: 'Tool forcefully updated. Check the tool in the UI to see if changes appear.',
      updatedFields: updateData,
      toolAfterUpdate: {
        ...verify,
        problemPhotoBuffer: verify.problemPhotoBuffer ? `<Buffer ${verify.problemPhotoBuffer.length} bytes>` : null
      },
      verification: {
        weightMatches: verify.weight === updateData.weight,
        dimensionsMatch: verify.dimensionLength === updateData.dimensionLength,
        complementaryInfoMatches: verify.complementaryInfo === updateData.complementaryInfo
      }
    })

  } catch (error) {
    console.error('[FORCE-UPDATE] ❌ Error:', error)
    return Response.json({
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}
