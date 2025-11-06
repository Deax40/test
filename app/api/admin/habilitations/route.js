import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

    const habilitations = await prisma.habilitation.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ habilitations })
  } catch (error) {
    console.error('Erreur lors de la récupération des habilitations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
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

    const formData = await request.formData()
    const userId = formData.get('userId')
    const file = formData.get('file')
    const expiresAt = formData.get('expiresAt')
    const title = formData.get('title')

    // Validation
    if (!userId || !file || !expiresAt) {
      return NextResponse.json({ error: 'Utilisateur, fichier et date d\'expiration sont requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Validation du fichier
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 10MB' }, { status: 400 })
    }

    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'uploads', 'habilitations')
    await mkdir(uploadDir, { recursive: true })

    // Générer un nom de fichier unique
    const fileName = `${Date.now()}_${targetUser.username}_${file.name}`
    const filePath = path.join(uploadDir, fileName)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Créer l'habilitation en base
    const habilitation = await prisma.habilitation.create({
      data: {
        userId: userId,
        title: title && title.trim() !== '' ? title.trim() : null,
        filePath: `uploads/habilitations/${fileName}`,
        expiresAt: new Date(expiresAt)
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ habilitation })
  } catch (error) {
    console.error('Erreur lors de la création de l\'habilitation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}