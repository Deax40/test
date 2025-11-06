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
    // Recherche insensible à la casse pour toolHash
    const certifications = await prisma.certification.findMany({
      where: {
        OR: [
          { toolId: toolId },
          { toolHash: { equals: toolId, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`[CERT] Found ${certifications.length} certifications for toolId=${toolId}`)
    return Response.json({ certifications })
  } else {
    // Récupérer tous les certificats
    const certifications = await prisma.certification.findMany({
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

    console.log('[CERT] ===== NEW CERTIFICATION REQUEST =====')
    console.log('[CERT] toolId:', toolId)
    console.log('[CERT] toolName:', toolName)
    console.log('[CERT] toolCategory:', toolCategory)
    console.log('[CERT] pdfFile:', pdfFile ? `YES (${pdfFile.size} bytes, ${pdfFile.type})` : 'NO')

    if (!toolId || !revisionDateStr || !toolName || !toolCategory) {
      console.log('[CERT] ❌ Missing required fields')
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
    console.log('[CERT] Checking PDF file...', { hasPdfFile: !!pdfFile, size: pdfFile?.size })
    if (pdfFile && pdfFile.size > 0) {
      console.log('[CERT] PDF file present, validating...')
      // Valider que c'est un PDF
      if (pdfFile.type !== 'application/pdf') {
        console.log('[CERT] ❌ Invalid file type:', pdfFile.type)
        return new Response('Only PDF files are allowed', { status: 400 })
      }

      // Limite de taille : 4MB pour Vercel
      if (pdfFile.size > 4 * 1024 * 1024) {
        console.log('[CERT] ❌ File too large:', pdfFile.size)
        return new Response('PDF trop volumineux (max 4MB)', { status: 400 })
      }

      console.log('[CERT] ✅ PDF validation passed, size:', pdfFile.size, 'bytes')

      // Stocker le PDF dans la base de données
      console.log('[CERT] Converting to buffer...')
      const bytes = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      certData.pdfBuffer = buffer
      certData.pdfType = pdfFile.type

      console.log('[CERT] ✅ PDF converted to buffer, size:', buffer.length, 'bytes')
    } else {
      console.log('[CERT] ⚠️  No PDF file provided or empty file')
    }

    const certification = await prisma.certification.create({
      data: certData
    })

    console.log('[CERT] ✅ Certification created:', certification.id, 'for', toolName)

    return Response.json({ certification })
  } catch (e) {
    console.error('Error creating certification', e)
    return new Response('Server error', { status: 500 })
  }
}

