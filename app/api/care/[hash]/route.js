import { getTool, updateTool, updateToolWithToken } from '@/lib/care-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBrokenToolAlertToAdmins } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// Configure route for larger body sizes (max 4MB due to Vercel limits)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request, { params }) {
  const tool = getTool(params.hash)
  if (!tool) {
    return Response.json({ error: 'Tool not found' }, { status: 404 })
  }
  return Response.json({ tool })
}

export async function PATCH(request, { params }) {
  const authHeader = request.headers.get('authorization')

  // Handle token-based authentication (from scan)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const data = await request.json()
    const result = updateToolWithToken(params.hash, data, token, data.user || 'Scan')

    if (!result) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 403 })
    }

    return Response.json({
      tool: result.tool,
      editSessionToken: result.token
    })
  }

  // Handle session-based authentication (from admin)
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'TECH') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if it's FormData (has file upload)
  const contentType = request.headers.get('content-type')
  let data
  let photoBuffer = null
  let photoType = null

  if (contentType?.includes('multipart/form-data')) {
    // Handle FormData with file upload
    const formData = await request.formData()
    data = {}

    // Extract regular fields
    for (const [key, value] of formData.entries()) {
      if (key !== 'problemPhoto') {
        data[key] = value
      }
    }

    // Ensure scan data is properly mapped
    if (data.location) {
      data.lastScanLieu = data.location
    }
    if (data.state) {
      data.lastScanEtat = data.state
    }
    if (data.user) {
      data.lastScanUser = data.user
      data.lastScanAt = new Date().toISOString()
    }

    // Handle file upload - Save to database instead of filesystem
    const problemPhoto = formData.get('problemPhoto')
    if (problemPhoto && problemPhoto.size > 0) {
      const bytes = await problemPhoto.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Store photo in database
      photoBuffer = buffer
      photoType = problemPhoto.type
      data.problemPhotoBuffer = buffer
      data.problemPhotoType = problemPhoto.type
    }
  } else {
    // Handle regular JSON
    data = await request.json()

    // Ensure scan data is properly mapped for JSON requests too
    if (data.location) {
      data.lastScanLieu = data.location
    }
    if (data.state) {
      data.lastScanEtat = data.state
    }
    if (data.user) {
      data.lastScanUser = data.user
      data.lastScanAt = new Date().toISOString()
    }
  }

  // Update in memory (legacy system)
  const tool = updateTool(params.hash, data, session.user.id, session.user.name)

  if (!tool) {
    return Response.json({ error: 'Tool not found' }, { status: 404 })
  }

  // Also update in Prisma database for Vercel persistence
  let dbSaveSuccess = false
  try {
    console.log('[CARE] Attempting to save to database:', params.hash)

    const updateData = {
      lastScanAt: data.lastScanAt ? new Date(data.lastScanAt) : new Date(),
      lastScanUser: data.lastScanUser || 'Unknown',
      lastScanLieu: data.lastScanLieu || null,
      lastScanEtat: data.lastScanEtat || 'RAS',
      problemDescription: data.problemDescription || null,
    }

    // Add photo to database if present
    if (data.problemPhotoBuffer) {
      updateData.problemPhotoBuffer = data.problemPhotoBuffer
      updateData.problemPhotoType = data.problemPhotoType
      console.log('[CARE] Adding photo to database')
    }

    const result = await prisma.tool.upsert({
      where: { hash: params.hash },
      update: updateData,
      create: {
        hash: params.hash,
        name: tool.name,
        category: tool.category || 'Care Tools',
        qrData: tool.qrData || `CARE_${params.hash}`,
        ...updateData,
      },
    })

    dbSaveSuccess = true
    console.log('[CARE] Database save SUCCESS:', result.id)
  } catch (dbError) {
    console.error('[CARE] Database save FAILED:', dbError.message)
    console.error('[CARE] Full error:', dbError)
    // Return error to client so user knows
    return Response.json({
      error: 'Database save failed',
      details: dbError.message,
      tool
    }, { status: 500 })
  }

  // Envoyer email à tous les admins si l'outil est cassé/abîmé
  if (data.state === 'Abîmé' || data.state === 'Problème') {
    try {
      await sendBrokenToolAlertToAdmins({
        toolName: tool.name,
        location: data.location || data.lastScanLieu,
        description: data.problemDescription,
        userName: session.user.name,
        photoBuffer,
        photoType,
        prisma
      })
    } catch (error) {
      console.error('Failed to send broken tool alert:', error)
      // Ne pas bloquer la réponse si l'email échoue
    }
  }

  return Response.json({ tool })
}