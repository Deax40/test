import { getLogs as getCareLogs, clearLogs } from '@/lib/care-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Récupérer les logs de Care (depuis le fichier JSON)
    const careLogs = getCareLogs().map(log => ({
      ...log,
      type: 'CARE',
      createdAt: log.createdAt
    }))

    // Récupérer les logs Prisma (scans généraux)
    const prismaLogs = await prisma.log.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedPrismaLogs = prismaLogs.map(log => ({
      id: log.id,
      type: 'SCAN',
      qrData: log.qrData,
      lieu: log.lieu,
      etat: log.etat,
      actorName: log.actorName,
      createdBy: log.createdBy,
      createdAt: log.createdAt
    }))

    // Récupérer les logs des outils Commun (ToolLog)
    const toolLogs = await prisma.toolLog.findMany({
      include: {
        createdBy: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedToolLogs = toolLogs.map(log => ({
      id: log.id,
      type: 'TOOL',
      tool: log.tool,
      status: log.status,
      lieu: log.lieu,
      etat: log.etat,
      createdBy: log.createdBy,
      createdAt: log.createdAt
    }))

    // Récupérer les logs Care depuis Prisma
    const careDbLogs = await prisma.careLog.findMany({
      include: {
        tool: {
          select: {
            name: true,
            hash: true
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedCareDbLogs = careDbLogs.map(log => ({
      id: log.id,
      type: 'CARE_DB',
      action: log.action,
      toolName: log.tool?.name,
      toolHash: log.tool?.hash,
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      userName: log.userName,
      createdBy: log.user,
      createdAt: log.createdAt
    }))

    // Combiner et trier tous les logs par date
    const allLogs = [...careLogs, ...formattedPrismaLogs, ...formattedToolLogs, ...formattedCareDbLogs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10) // Limiter aux 10 plus récents

    return Response.json({ logs: allLogs })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    clearLogs()
    return Response.json({ success: true, message: 'Tous les logs ont été supprimés' })
  } catch (error) {
    console.error('Error clearing logs:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
