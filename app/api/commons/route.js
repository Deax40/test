import { prisma } from '@/lib/prisma'

// Force dynamic mode - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Read Commun Tools from Prisma database
    const tools = await prisma.tool.findMany({
      where: {
        OR: [
          { category: 'Commun Tools' },
          { category: 'COMMUN' }
        ]
      },
      orderBy: { name: 'asc' }
    })

    console.log('[COMMONS] Found', tools.length, 'tools in database')
    return Response.json({ tools })
  } catch (error) {
    console.error('[COMMONS] Error fetching tools:', error.message)
    return Response.json({ error: 'Database error', tools: [] }, { status: 500 })
  }
}
