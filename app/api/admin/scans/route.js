import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Récupérer les scans des deux tables
    const toolLogs = await prisma.toolLog.findMany({
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const logs = await prisma.log.findMany({
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Combiner et formater les données
    const allScans = [
      ...toolLogs.map(log => ({
        id: log.id,
        tool: log.tool,
        lieu: log.lieu,
        etat: log.etat || 'RAS',
        createdAt: log.createdAt,
        createdBy: log.createdBy,
        source: 'toolLog'
      })),
      ...logs.map(log => ({
        id: log.id,
        tool: log.qrData,
        lieu: log.lieu,
        etat: log.etat || 'RAS',
        createdAt: log.createdAt,
        createdBy: log.createdBy,
        source: 'log'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return Response.json({ scans: allScans })
  } catch (error) {
    console.error('Error fetching scans:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
