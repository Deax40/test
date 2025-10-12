import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Inspect a tool directly from database
 * Usage: GET /api/debug/inspect-tool/[hash]
 */
export async function GET(request, { params }) {
  try {
    const normalized = String(params.hash).trim().toUpperCase()

    console.log('[INSPECT] Looking for tool with hash:', normalized)

    const tool = await prisma.tool.findUnique({
      where: { hash: normalized }
    })

    if (!tool) {
      return Response.json({
        error: 'Tool not found',
        searchedHash: normalized
      }, { status: 404 })
    }

    // List ALL fields with their values
    const fieldInspection = {}
    const emptyFields = []
    const filledFields = []

    for (const [key, value] of Object.entries(tool)) {
      fieldInspection[key] = {
        value: value,
        type: typeof value,
        isEmpty: value === null || value === undefined || value === '',
        isBuffer: value instanceof Buffer
      }

      if (value === null || value === undefined || value === '') {
        emptyFields.push(key)
      } else {
        filledFields.push(key)
      }
    }

    return Response.json({
      success: true,
      tool: {
        ...tool,
        // Convert Buffer to string for display
        problemPhotoBuffer: tool.problemPhotoBuffer ? `<Buffer ${tool.problemPhotoBuffer.length} bytes>` : null
      },
      fieldInspection,
      summary: {
        totalFields: Object.keys(tool).length,
        filledFields: filledFields.length,
        emptyFields: emptyFields.length,
        filledFieldsList: filledFields,
        emptyFieldsList: emptyFields
      }
    })
  } catch (error) {
    console.error('[INSPECT] Error:', error)
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
