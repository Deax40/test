import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Compter tous les outils depuis Prisma ET depuis le système commun
    const totalToolsPrisma = await prisma.tool.count()

    // Ajouter les outils du système commun
    let communToolsCount = 0
    try {
      const communRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://test-beta-ivory-52.vercel.app'}/api/commons`, {
        cache: 'no-store'
      })
      if (communRes.ok) {
        const communData = await communRes.json()
        communToolsCount = (communData.tools || []).length
      }
    } catch (e) {
      console.error('Error fetching commun tools:', e)
    }

    const totalTools = totalToolsPrisma + communToolsCount

    // Compter les scans d'aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayScans = await prisma.log.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Récupérer les détails des scans d'aujourd'hui
    const todayScansDetails = await prisma.log.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Récupérer les outils avec problèmes (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const problemLogs = await prisma.log.findMany({
      where: {
        OR: [
          { etat: 'Problème' },
          { etat: 'Abîmé' },
          { etat: 'En maintenance' },
          { etat: 'Hors service' }
        ],
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Récupérer tous les outils Care et Commun pour pouvoir faire le mapping hash -> nom
    let careToolsMap = {}
    let communToolsMap = {}
    let careToolsWithProblems = []
    let communToolsWithProblems = []

    try {
      const careRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://test-beta-ivory-52.vercel.app'}/api/care`, {
        cache: 'no-store'
      })
      if (careRes.ok) {
        const careData = await careRes.json()
        const careTools = careData.tools || []

        // Créer un map hash -> nom pour les outils Care
        careTools.forEach(tool => {
          careToolsMap[tool.hash] = tool.name
        })

        // Filtrer les outils avec problèmes
        careToolsWithProblems = careTools.filter(tool =>
          tool.lastScanEtat &&
          tool.lastScanEtat !== 'RAS' &&
          tool.lastScanEtat !== '' &&
          (tool.lastScanEtat === 'Abîmé' ||
           tool.lastScanEtat === 'Problème' ||
           tool.lastScanEtat === 'En maintenance' ||
           tool.lastScanEtat === 'Hors service')
        )
      }
    } catch (e) {
      console.error('Error fetching care tools:', e)
    }

    try {
      const communRes = await fetch(`${process.env.NEXTAUTH_URL || 'https://test-beta-ivory-52.vercel.app'}/api/commons`, {
        cache: 'no-store'
      })
      if (communRes.ok) {
        const communData = await communRes.json()
        const communTools = communData.tools || []

        // Créer un map hash -> nom pour les outils Commun
        communTools.forEach(tool => {
          communToolsMap[tool.hash] = tool.name
        })

        // Filtrer les outils avec problèmes
        communToolsWithProblems = communTools.filter(tool =>
          (tool.lastScanEtat && tool.lastScanEtat !== 'RAS') ||
          (tool.state && tool.state !== 'RAS' && tool.state !== '')
        )
      }
    } catch (e) {
      console.error('Error fetching commun tools:', e)
    }

    const problems = problemLogs.length + careToolsWithProblems.length + communToolsWithProblems.length
    const problemToolsDetails = [
      ...problemLogs.map(log => {
        // Essayer de trouver le nom de l'outil à partir du hash dans qrData
        const toolHash = log.qrData
        const toolName = careToolsMap[toolHash] || communToolsMap[toolHash] || toolHash || 'Outil inconnu'

        return {
          name: toolName,
          lastScanLieu: log.lieu,
          lastScanAt: log.createdAt,
          lastScanUser: log.createdBy?.name || log.actorName,
          lastScanEtat: log.etat,
          problemDescription: log.probleme
        }
      }),
      ...careToolsWithProblems.map(tool => ({
        name: tool.name,
        lastScanLieu: tool.lastScanLieu,
        lastScanAt: tool.lastScanAt,
        lastScanUser: tool.lastScanUser,
        lastScanEtat: tool.lastScanEtat,
        problemDescription: tool.problemDescription,
        problemPhoto: tool.problemPhoto
      })),
      ...communToolsWithProblems.map(tool => ({
        name: tool.name,
        lastScanLieu: tool.lastScanLieu,
        lastScanAt: tool.lastScanAt,
        lastScanUser: tool.lastScanBy,
        lastScanEtat: tool.lastScanEtat || tool.state,
        problemDescription: tool.problemDescription
      }))
    ]

    return NextResponse.json({
      totalTools,
      todayScans,
      problems,
      todayScansDetails: todayScansDetails.map(scan => {
        // Essayer de trouver le nom de l'outil à partir du hash dans qrData
        const toolHash = scan.qrData
        const toolName = careToolsMap[toolHash] || communToolsMap[toolHash] || toolHash || 'Outil inconnu'

        return {
          toolName: toolName,
          lieu: scan.lieu,
          etat: scan.etat || 'RAS',
          actorName: scan.createdBy?.name || scan.actorName,
          createdAt: scan.createdAt
        }
      }),
      problemToolsDetails
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}