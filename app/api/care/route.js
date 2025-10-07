import { prisma } from '@/lib/prisma'
import { refreshToolsFromFiles } from '@/lib/care-data'

const CARE_CATEGORY_KEYWORDS = ['care']

export async function GET() {
  // Prefer database (works on Vercel); fallback to file-based if empty
  try {
    const dbTools = await prisma.tool.findMany({
      where: {
        OR: CARE_CATEGORY_KEYWORDS.map(keyword => ({
          category: {
            contains: keyword,
            mode: 'insensitive'
          }
        }))
      },
      orderBy: { name: 'asc' }
    })

    if (dbTools && dbTools.length > 0) {
      // Return as-is; UI reads name/hash/lastScan*
      return Response.json({ tools: dbTools })
    }
  } catch (e) {
    console.error('[CARE] Error fetching tools from Prisma:', e)
    if (process.env.VERCEL) {
      return Response.json({ error: 'Database error', tools: [] }, { status: 500 })
    }
  }

  // On development environments we keep the legacy filesystem fallback
  if (!process.env.VERCEL) {
    const tools = refreshToolsFromFiles()
    return Response.json({ tools })
  }

  return Response.json({ tools: [] })
}
