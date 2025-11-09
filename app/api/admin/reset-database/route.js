import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // 1. Get the last 6 scans per tool (from logs)
    const tools = await prisma.tool.findMany({
      select: { id: true, name: true, hash: true }
    })

    const backupData = {}

    // For each tool, get the last 6 log entries
    for (const tool of tools) {
      const recentLogs = await prisma.log.findMany({
        where: { qrData: tool.hash },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { createdBy: { select: { name: true, username: true } } }
      })

      const recentToolLogs = await prisma.toolLog.findMany({
        where: { tool: tool.name },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { createdBy: { select: { name: true, username: true } } }
      })

      backupData[tool.hash] = {
        toolInfo: tool,
        recentLogs,
        recentToolLogs
      }
    }

    // 2. Clear all data except users and tool definitions
    await prisma.log.deleteMany({})
    await prisma.toolLog.deleteMany({})
    await prisma.certification.deleteMany({})
    await prisma.habilitation.deleteMany({})
    await prisma.machineRevision.deleteMany({})

    // Reset tool scan info
    await prisma.tool.updateMany({
      data: {
        lastScanAt: null,
        lastScanUser: null,
        lastScanLieu: null,
        lastScanEtat: null
      }
    })

    // 3. Restore the last 6 scans per tool
    for (const [toolHash, data] of Object.entries(backupData)) {
      // Restore logs (but only the most recent ones)
      for (const log of data.recentLogs.slice(0, 6)) {
        await prisma.log.create({
          data: {
            qrData: log.qrData,
            lieu: log.lieu,
            date: log.date,
            actorName: log.actorName,
            etat: log.etat,
            probleme: log.probleme,
            photo: log.photo,
            photoType: log.photoType,
            createdById: log.createdById
          }
        })
      }

      // Restore tool logs
      for (const toolLog of data.recentToolLogs.slice(0, 6)) {
        await prisma.toolLog.create({
          data: {
            tool: toolLog.tool,
            status: toolLog.status,
            lieu: toolLog.lieu,
            client: toolLog.client,
            etat: toolLog.etat,
            transporteur: toolLog.transporteur,
            tracking: toolLog.tracking,
            createdById: toolLog.createdById
          }
        })
      }

      // Update tool with most recent scan info
      if (data.recentLogs.length > 0) {
        const mostRecent = data.recentLogs[0]
        await prisma.tool.update({
          where: { hash: toolHash },
          data: {
            lastScanAt: mostRecent.createdAt,
            lastScanUser: mostRecent.actorName,
            lastScanLieu: mostRecent.lieu,
            lastScanEtat: mostRecent.etat
          }
        })
      }
    }

    return Response.json({
      success: true,
      message: `Base de données réinitialisée. ${Object.keys(backupData).length} outils traités avec conservation des 6 derniers scans.`,
      backupSummary: Object.keys(backupData).map(hash => {
        const data = backupData[hash]
        return {
          tool: data.toolInfo.name,
          logsRestored: data.recentLogs.length,
          toolLogsRestored: data.recentToolLogs.length
        }
      })
    })

  } catch (error) {
    console.error('Error resetting database:', error)
    return new Response('Server error', { status: 500 })
  }
}