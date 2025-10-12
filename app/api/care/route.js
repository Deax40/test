import { PrismaClient } from '@prisma/client'
import { refreshToolsFromFiles } from '@/lib/care-data'

const prisma = new PrismaClient()

export async function GET() {
  // Prefer database (works on Vercel); fallback to file-based if empty
  try {
    const dbTools = await prisma.tool.findMany({
      where: { category: 'CARE' },
      orderBy: { name: 'asc' }
    })

    if (dbTools && dbTools.length > 0) {
      // Return as-is; UI reads name/hash/lastScan*
      return Response.json({ tools: dbTools })
    }
  } catch (e) {
    // Ignore and fallback
  }

  const tools = refreshToolsFromFiles()
  return Response.json({ tools })
}
