import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CARE_CATEGORIES = new Set([
  'CARE',
  'CARE TOOLS',
  'CARE_TOOLS',
  'CARETOOLS',
  'CARE TOOL',
  'CARE-TOOLS',
  'CARE EQUIPMENT',
  'CARE EQUIPMENTS'
])

const COMMUN_CATEGORIES = new Set([
  'COMMUN',
  'COMMON',
  'COMMUN TOOLS',
  'COMMUN_TOOLS',
  'COMMUNTOOLS',
  'COMMUN TOOL',
  'COMMON TOOLS',
  'COMMUN EQUIPMENT',
  'COMMUN EQUIPMENTS',
  'COMMUNS',
  'COMMUNS TOOLS',
  'COMMUNS_TOOLS'
])

function normalizeCategory(category) {
  return String(category || '')
    .trim()
    .toUpperCase()
}

function normalizeHash(hash) {
  return String(hash || '')
    .trim()
    .toUpperCase()
    .replace(/^CARE_/, '')
    .replace(/^COMMON_/, '')
    .replace(/^COMMUN_/, '')
}

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

    // Charger tous les outils une fois pour éviter les requêtes HTTP internes
    const allTools = await prisma.tool.findMany({
      orderBy: { name: 'asc' }
    })

    const totalTools = allTools.length

    const careTools = allTools.filter(tool => CARE_CATEGORIES.has(normalizeCategory(tool.category)))
    const communTools = allTools.filter(tool => COMMUN_CATEGORIES.has(normalizeCategory(tool.category)))

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
    const careToolsMap = {}
    const communToolsMap = {}

    careTools.forEach(tool => {
      if (tool.hash) {
        const hash = normalizeHash(tool.hash)
        careToolsMap[hash] = tool.name
      }
      if (tool.qrData) {
        const hash = normalizeHash(tool.qrData)
        careToolsMap[hash] = tool.name
      }
    })

    communTools.forEach(tool => {
      if (tool.hash) {
        const hash = normalizeHash(tool.hash)
        communToolsMap[hash] = tool.name
      }
      if (tool.qrData) {
        const hash = normalizeHash(tool.qrData)
        communToolsMap[hash] = tool.name
      }
    })

    const careToolsWithProblems = careTools.filter(tool => {
      const state = tool.lastScanEtat || ''
      if (!state || state === 'RAS') return false
      return ['ABÎMÉ', 'PROBLÈME', 'PROBLEME', 'EN MAINTENANCE', 'HORS SERVICE'].includes(state.toUpperCase())
    })

    const communToolsWithProblems = communTools.filter(tool => {
      const state = tool.lastScanEtat || tool.state || ''
      if (!state || state === 'RAS') return false
      return true
    })

    const problems = problemLogs.length + careToolsWithProblems.length + communToolsWithProblems.length
    const problemToolsDetails = [
      ...problemLogs.map(log => {
        // Essayer de trouver le nom de l'outil à partir du hash dans qrData
        const toolHash = normalizeHash(log.qrData)
        const toolName = careToolsMap[toolHash] || communToolsMap[toolHash] || log.qrData || 'Outil inconnu'

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
        lastScanUser: tool.lastScanUser,
        lastScanEtat: tool.lastScanEtat || tool.state,
        problemDescription: tool.problemDescription
      }))
    ]

    return NextResponse.json({
      totalTools,
      todayScans,
      problems,
      careToolsCount: careTools.length,
      communToolsCount: communTools.length,
      todayScansDetails: todayScansDetails.map(scan => {
        // Essayer de trouver le nom de l'outil à partir du hash dans qrData
        const toolHash = normalizeHash(scan.qrData)
        const toolName = careToolsMap[toolHash] || communToolsMap[toolHash] || scan.qrData || 'Outil inconnu'

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