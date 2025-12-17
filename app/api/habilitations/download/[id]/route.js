import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: session.user.username }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const { id } = params

    // Récupérer l'habilitation
    const habilitation = await prisma.habilitation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    if (!habilitation) {
      return NextResponse.json({ error: 'Habilitation non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions : admin ou propriétaire de l'habilitation
    if (currentUser.role !== 'ADMIN' && currentUser.id !== habilitation.userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer le fichier depuis la base de données ou le système de fichiers (legacy)
    let fileBuffer
    let fileName = habilitation.fileName || 'habilitation.pdf'

    if (habilitation.fileBuffer) {
      // Nouveau système : fichier en base de données
      fileBuffer = habilitation.fileBuffer
    } else if (habilitation.filePath) {
      // Legacy : fichier sur le système de fichiers
      try {
        const fullPath = path.join(process.cwd(), habilitation.filePath)
        fileBuffer = await readFile(fullPath)
        fileName = habilitation.filePath.split('/').pop().replace(/^\d+_[^_]+_/, '')
      } catch (fileError) {
        console.error('Erreur lors de la lecture du fichier legacy:', fileError)
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Aucun fichier disponible' }, { status: 404 })
    }

    // Vérifier si c'est une requête pour visualiser ou télécharger
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'view' ou 'download'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': habilitation.fileType || 'application/pdf',
        'Content-Disposition': action === 'download'
          ? `attachment; filename="${fileName}"`
          : `inline; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'habilitation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}