import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return Response.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { toolName, type, lastScanEtat } = await request.json()

    if (!toolName) {
      return Response.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    console.log('[RESOLVE] Resolving problem for:', toolName)

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

    // 2. Mettre à jour l'outil dans Prisma Tool (Care tools)
    try {
      // Chercher l'outil par nom
      const tool = await prisma.tool.findFirst({
        where: {
          name: {
            contains: toolName,
            mode: 'insensitive'
          }
        }
      })

      if (tool) {
        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            lastScanEtat: 'RAS',
            lastScanAt: new Date(),
            lastScanUser: session.user.name,
            problemDescription: null,
            problemPhotoBuffer: null,
            problemPhotoType: null
          }
        })

        console.log('[RESOLVE] Updated Care tool:', tool.name)
        success = true
      }
    } catch (error) {
      console.error('[RESOLVE] Error updating Care tool:', error)
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
