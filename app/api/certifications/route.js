import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTool } from '@/lib/care-data'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const toolId = searchParams.get('toolId')

  if (toolId) {
    // Récupérer les certificats pour un outil spécifique (par toolId ou toolHash)
    const certifications = await prisma.certification.findMany({
      where: {
        OR: [
          { toolId: toolId },
          { toolHash: toolId }
        ]
      },
      include: { tool: true },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json({ certifications })
  } else {
    // Récupérer tous les certificats
    const certifications = await prisma.certification.findMany({
      include: { tool: true },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json({ certifications })
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  try {
    const formData = await req.formData()
    const toolId = formData.get('toolId')
    const revisionDateStr = formData.get('revisionDate')
    const toolName = formData.get('toolName')
    const toolCategory = formData.get('toolCategory')
    const pdfFile = formData.get('pdfFile')

    if (!toolId || !revisionDateStr || !toolName || !toolCategory) {
      return new Response('Missing fields', { status: 400 })
    }

    const revisionDate = new Date(revisionDateStr)
    if (isNaN(revisionDate.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }

    // Déterminer si c'est un outil CARE (avec toolId) ou COMMUN (avec toolHash)
    const certData = {
      toolName,
      toolCategory,
      revisionDate
    }

    if (toolCategory === 'CARE') {
      // Pour les outils CARE, vérifier que l'outil existe dans le système de fichiers
      const careTool = getTool(toolId)
      if (careTool) {
        certData.toolHash = toolId // Utiliser le hash pour les outils CARE aussi
      } else {
        return new Response('Care tool not found', { status: 404 })
      }
    } else if (toolCategory === 'COMMUN') {
      // Pour les outils COMMUN, utiliser le hash
      certData.toolHash = toolId
    }

    // Gérer l'upload du PDF si présent
    if (pdfFile && pdfFile.size > 0) {
      // Valider que c'est un PDF
      if (pdfFile.type !== 'application/pdf') {
        return new Response('Only PDF files are allowed', { status: 400 })
      }

      // Limite de taille : 4MB pour Vercel
      if (pdfFile.size > 4 * 1024 * 1024) {
        return new Response('PDF trop volumineux (max 4MB)', { status: 400 })
      }

      // Sur Vercel, le filesystem est en lecture seule
      // On stocke simplement un chemin symbolique
      // TODO: Utiliser un service de stockage externe (S3, Vercel Blob, etc.)
      const timestamp = Date.now()
      const sanitizedToolName = toolName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const filename = `cert_${sanitizedToolName}_${timestamp}.pdf`

      console.log('[CERT] PDF upload:', filename, 'size:', pdfFile.size)

      // Pour l'instant, on indique juste qu'un certificat a été uploadé
      // Sans le stocker (nécessite un service externe pour Vercel)
      certData.pdfPath = `/certifications/${filename}` // Placeholder
      console.warn('[CERT] Warning: PDF not actually stored (requires external storage on Vercel)')
    }

    const certification = await prisma.certification.create({
      data: certData,
      include: { tool: true }
    })
    return Response.json({ certification })
  } catch (e) {
    console.error('Error creating certification', e)
    return new Response('Server error', { status: 500 })
  }
}

