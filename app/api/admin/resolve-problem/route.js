import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return Response.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { toolName, toolHash, type, lastScanEtat } = await request.json()

    if (!toolName && !toolHash) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    console.log('[RESOLVE] Resolving problem for:', toolName, 'hash:', toolHash)

    let success = false

    // 1. Mettre à jour les logs Prisma avec problèmes
    try {
      const updatedLogs = await prisma.log.updateMany({
        where: {
          etat: {
            in: ['Problème', 'Abîmé', 'En maintenance', 'Hors service']
          },
          OR: [
            { qrData: toolName },
            { qrData: { contains: toolName } }
          ]
        },
        data: {
          etat: 'RAS',
          probleme: null
        }
      })

      if (updatedLogs.count > 0) {
        console.log(`[RESOLVE] Updated ${updatedLogs.count} logs`)
        success = true
      }
    } catch (error) {
      console.error('[RESOLVE] Error updating logs:', error)
    }

    // 2. Mettre à jour l'outil dans Prisma Tool
    try {
      // Chercher l'outil par hash d'abord (plus fiable), puis par nom
      let tool = null

      if (toolHash) {
        tool = await prisma.tool.findUnique({
          where: { hash: toolHash }
        })
        console.log('[RESOLVE] Search by hash:', toolHash, '- Found:', !!tool)
      }

      if (!tool && toolName) {
        tool = await prisma.tool.findFirst({
          where: {
            OR: [
              { name: { contains: toolName, mode: 'insensitive' } },
              { hash: { contains: toolName, mode: 'insensitive' } },
              { qrData: { contains: toolName, mode: 'insensitive' } }
            ]
          }
        })
        console.log('[RESOLVE] Search by name:', toolName, '- Found:', !!tool)
      }

      if (tool) {
        const updatedTool = await prisma.tool.update({
          where: { id: tool.id },
          data: {
            lastScanEtat: 'RAS',
            lastScanAt: new Date(),
            lastScanUser: session.user.name,
            lastScanLieu: tool.lastScanLieu, // Keep existing location
            problemDescription: null,
            problemPhotoBuffer: null,
            problemPhotoType: null
          }
        })

        console.log('[RESOLVE] ✅ Updated tool:', updatedTool.name, 'to state:', updatedTool.lastScanEtat)
        success = true
      } else {
        console.log('[RESOLVE] ⚠️ Tool not found in database:', toolName)
      }
    } catch (error) {
      console.error('[RESOLVE] ❌ Error updating tool:', error.message)
    }

    // 3. Créer un log de résolution
    try {
      await prisma.log.create({
        data: {
          qrData: toolName,
          lieu: 'Admin',
          date: new Date(),
          actorName: session.user.name,
          etat: 'RAS',
          probleme: `Problème résolu par ${session.user.name}`
        }
      })
      console.log('[RESOLVE] Created resolution log')
    } catch (error) {
      console.error('[RESOLVE] Error creating log:', error)
    }

    if (success) {
      return Response.json({
        success: true,
        message: `Problème résolu pour "${toolName}"`
      })
    } else {
      console.error('[RESOLVE] No updates made')
      return Response.json({
        error: 'Outil non trouvé ou aucune mise à jour nécessaire',
        details: `Aucun problème trouvé pour l'outil "${toolName}"`
      }, { status: 404 })
    }

  } catch (error) {
    console.error('[RESOLVE] Error:', error)
    return Response.json({
      error: 'Erreur serveur',
      details: error.message
    }, { status: 500 })
  }
}
