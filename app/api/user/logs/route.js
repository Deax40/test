import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.user.findUnique({
      where: { username: session.user.username }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Si un userId spécifique est demandé, vérifier les permissions
    let targetUserId = currentUser.id
    if (requestedUserId) {
      // Seuls les admins peuvent voir les logs d'autres utilisateurs
      if (currentUser.role !== 'ADMIN' && requestedUserId !== currentUser.id) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
      }
      targetUserId = requestedUserId
    }

    // Récupérer les logs de scan (table Log)
    const scanLogs = await prisma.log.findMany({
      where: {
        createdById: targetUserId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 entrées récentes
    })

    // Récupérer les logs d'outils (table ToolLog)
    const toolLogs = await prisma.toolLog.findMany({
      where: {
        createdById: targetUserId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 entrées récentes
    })

    // Combiner et trier tous les logs
    const allLogs = [
      ...scanLogs.map(log => ({
        ...log,
        type: 'scan',
        qrData: log.qrData,
        lieu: log.lieu,
        etat: log.etat,
        createdAt: log.createdAt
      })),
      ...toolLogs.map(log => ({
        ...log,
        type: 'tool',
        tool: log.tool,
        lieu: log.lieu,
        etat: log.etat,
        createdAt: log.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return NextResponse.json({ logs: allLogs.slice(0, 100) })
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}