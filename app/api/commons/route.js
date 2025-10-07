import { listTools } from '@/lib/commun-data'
import { prisma } from '@/lib/prisma'

function formatCommunTool(tool) {
  if (!tool) return tool
  return {
    ...tool,
    location: tool.location ?? tool.lastScanLieu ?? '',
    state: tool.state ?? tool.lastScanEtat ?? '',
    lastScanBy: tool.lastScanBy ?? tool.lastScanUser ?? '',
  }
}

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      where: { category: 'COMMUN' },
      orderBy: { name: 'asc' },
    })

    if (tools.length > 0) {
      return Response.json({ tools: tools.map(formatCommunTool) })
    }
  } catch (error) {
    console.error('Failed to load commun tools from database:', error)
  }

  return Response.json({ tools: listTools().map(formatCommunTool) })
}
