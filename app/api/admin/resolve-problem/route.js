import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTool, updateTool } from '@/lib/care-data'
import { listTools, updateTool as updateCommunTool } from '@/lib/commun-data'
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

    let success = false

    // D'abord, récupérer tous les outils pour faire le mapping nom -> hash
    let toolHash = null
    try {
      // Chercher dans les outils CARE
      const careRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/care`, {
        cache: 'no-store'
      })
      if (careRes.ok) {
        const careData = await careRes.json()
        const careTool = careData.tools.find(t => t.name === toolName)
        if (careTool) {
          toolHash = careTool.hash
        }
      }

      // Si pas trouvé dans CARE, chercher dans COMMUN
      if (!toolHash) {
        const communRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/commons`, {
          cache: 'no-store'
        })
        if (communRes.ok) {
          const communData = await communRes.json()
          const communTool = communData.tools.find(t => t.name === toolName)
          if (communTool) {
            toolHash = communTool.hash
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du hash de l\'outil:', error)
    }

    // Essayer de supprimer/mettre à jour les logs Prisma avec problèmes
    try {
      const whereCondition = {
        etat: {
          in: ['Problème', 'Abîmé', 'En maintenance', 'Hors service']
        }
      }

      // Chercher par hash si disponible, sinon par nom
      if (toolHash) {
        whereCondition.qrData = toolHash
      } else {
        whereCondition.OR = [
          { qrData: toolName },
          { qrData: { contains: toolName } }
        ]
      }

      const updatedLogs = await prisma.log.updateMany({
        where: whereCondition,
        data: {
          etat: 'RAS',
          probleme: null
        }
      })

      if (updatedLogs.count > 0) {
        success = true
        console.log(`Mis à jour ${updatedLogs.count} logs Prisma pour l'outil ${toolName}`)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des logs Prisma:', error)
    }

    // Essayer de mettre à jour l'outil dans les systèmes CARE et COMMUN
    // Essayer d'abord CARE (si type spécifié comme 'care' ou pas de type spécifié)
    if (!type || type === 'care') {
      try {
        const careTools = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/care`, {
          cache: 'no-store'
        })

        if (careTools.ok) {
          const careData = await careTools.json()
          const tool = careData.tools.find(t => t.name === toolName)

          if (tool) {
            // Remettre l'outil à l'état RAS (résolu)
            const result = updateTool(tool.hash, {
              lastScanEtat: 'RAS',
              lastScanAt: new Date().toISOString(),
              lastScanUser: session.user.name,
              problemDescription: null,
              problemPhoto: null
            }, session.user.id, session.user.name)

            if (result) {
              success = true
              console.log(`Outil CARE ${toolName} résolu avec succès`)
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la résolution de l\'outil CARE:', error)
      }
    }

    // Essayer COMMUN (si type spécifié comme 'commun' ou pas de type spécifié et pas encore résolu)
    if ((!type && !success) || type === 'commun') {
      try {
        const communTools = listTools()
        const tool = communTools.find(t => t.name === toolName)

        if (tool) {
          // Remettre l'outil à l'état RAS (résolu)
          const result = updateCommunTool(tool.hash, {
            state: 'RAS',
            lastScanEtat: 'RAS',
            lastScanAt: new Date().toISOString(),
            lastScanBy: session.user.name,
            problemDescription: null
          }, session.user.name)

          if (result) {
            success = true
            console.log(`Outil COMMUN ${toolName} résolu avec succès`)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la résolution de l\'outil COMMUN:', error)
      }
    }

    if (success) {
      return Response.json({
        success: true,
        message: `Problème résolu pour "${toolName}"`
      })
    } else {
      return Response.json({
        error: 'Outil non trouvé ou erreur lors de la résolution'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Erreur lors de la résolution du problème:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}