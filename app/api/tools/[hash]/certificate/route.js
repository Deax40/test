import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
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

    const { hash } = params
    const formData = await request.formData()
    const file = formData.get('certificate')

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'Fichier certificat requis' }, { status: 400 })
    }

    // Vérifier que l'outil existe
    const tool = await prisma.tool.findUnique({
      where: { hash }
    })

    if (!tool) {
      return NextResponse.json({ error: 'Outil non trouvé' }, { status: 404 })
    }

    // Validation du fichier
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 10MB' }, { status: 400 })
    }

    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'uploads', 'certificates')
    await mkdir(uploadDir, { recursive: true })

    // Générer un nom de fichier unique
    const fileName = `${Date.now()}_${tool.hash}_${file.name}`
    const filePath = path.join(uploadDir, fileName)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Mettre à jour l'outil avec le chemin du certificat
    const updatedTool = await prisma.tool.update({
      where: { hash },
      data: {
        certificatePath: `uploads/certificates/${fileName}`
      }
    })

    return NextResponse.json({
      message: 'Certificat ajouté avec succès',
      tool: updatedTool
    })
  } catch (error) {
    console.error('Erreur lors de l\'ajout du certificat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

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

    const { hash } = params

    // Vérifier que l'outil existe
    const tool = await prisma.tool.findUnique({
      where: { hash }
    })

    if (!tool) {
      return NextResponse.json({ error: 'Outil non trouvé' }, { status: 404 })
    }

    // Supprimer le fichier s'il existe
    if (tool.certificatePath) {
      try {
        const { unlink } = await import('fs/promises')
        const fullPath = path.join(process.cwd(), tool.certificatePath)
        await unlink(fullPath)
      } catch (fileError) {
        console.error('Erreur lors de la suppression du fichier:', fileError)
        // Continuer même si la suppression du fichier échoue
      }
    }

    // Mettre à jour l'outil pour supprimer le certificat
    const updatedTool = await prisma.tool.update({
      where: { hash },
      data: {
        certificatePath: null
      }
    })

    return NextResponse.json({
      message: 'Certificat supprimé avec succès',
      tool: updatedTool
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du certificat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}