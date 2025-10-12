import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { hash } = params

    // Récupérer l'outil
    const tool = await prisma.tool.findUnique({
      where: { hash }
    })

    if (!tool) {
      return NextResponse.json({ error: 'Outil non trouvé' }, { status: 404 })
    }

    if (!tool.certificatePath) {
      return NextResponse.json({ error: 'Aucun certificat disponible pour cet outil' }, { status: 404 })
    }

    // Lire le fichier
    try {
      const fullPath = path.join(process.cwd(), tool.certificatePath)
      const fileBuffer = await readFile(fullPath)

      // Extraire le nom original du fichier
      const originalFileName = tool.certificatePath.split('/').pop().replace(/^\d+_[^_]+_/, '') || `certificat_${tool.name}.pdf`

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${originalFileName}"`,
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (fileError) {
      console.error('Erreur lors de la lecture du fichier:', fileError)
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement du certificat:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}