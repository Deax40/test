import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
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

    const { id } = params

    // Récupérer l'habilitation pour obtenir le chemin du fichier
    const habilitation = await prisma.habilitation.findUnique({
      where: { id }
    })

    if (!habilitation) {
      return NextResponse.json({ error: 'Habilitation non trouvée' }, { status: 404 })
    }

    // Supprimer le fichier du système de fichiers
    try {
      const fullPath = path.join(process.cwd(), habilitation.filePath)
      await unlink(fullPath)
    } catch (fileError) {
      console.error('Erreur lors de la suppression du fichier:', fileError)
      // Continuer même si la suppression du fichier échoue
    }

    // Supprimer l'habilitation de la base de données
    await prisma.habilitation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Habilitation supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'habilitation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}