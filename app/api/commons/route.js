import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Read Commun Tools from Prisma database
    const tools = await prisma.tool.findMany({
      where: {
        OR: [
          { category: { contains: 'commun', mode: 'insensitive' } },
          { category: { contains: 'common', mode: 'insensitive' } }
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
