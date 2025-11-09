import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Force migration: Add weight and imoNumber columns
 * Usage: GET /api/debug/force-migration
 */
export async function GET(request) {
  console.log('[FORCE-MIGRATION] Starting forced migration...')

  try {
    // Execute raw SQL to add columns if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Tool"
      ADD COLUMN IF NOT EXISTS "weight" TEXT,
      ADD COLUMN IF NOT EXISTS "imoNumber" TEXT;
    `)

    console.log('[FORCE-MIGRATION] ✅ Migration executed successfully')

    // Verify columns exist by trying to read them
    const testTool = await prisma.tool.findFirst()

    return Response.json({
      success: true,
      message: 'Migration executed successfully',
      columns: {
        weight: testTool?.weight !== undefined ? 'EXISTS' : 'MISSING',
        imoNumber: testTool?.imoNumber !== undefined ? 'EXISTS' : 'MISSING',
      },
      sampleTool: testTool ? {
        id: testTool.id,
        name: testTool.name,
        hasWeight: 'weight' in testTool,
        hasImoNumber: 'imoNumber' in testTool,
      } : null
    })
  } catch (error) {
    console.error('[FORCE-MIGRATION] ❌ Migration failed:', error.message)
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
