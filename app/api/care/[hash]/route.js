import { getTool, updateTool, updateToolWithToken } from '@/lib/care-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBrokenToolAlertToAdmins } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// Configure route for larger body sizes (max 4MB due to Vercel limits)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request, { params }) {
  // Try memory first
  let tool = getTool(params.hash)

  // If not in memory, try Prisma database
  if (!tool) {
    try {
      const normalized = String(params.hash).trim().toUpperCase()
      tool = await prisma.tool.findUnique({
        where: { hash: normalized }
      })
    } catch (error) {
      console.error('[CARE] Error fetching tool from database:', error)
    }
  }

  if (!tool) {
    return Response.json({ error: 'Tool not found' }, { status: 404 })
  }

  return Response.json({ tool })
}

export async function PATCH(request, { params }) {
  const authHeader = request.headers.get('authorization')
  let userName = 'Anonymous'
  let userId = null

  // Handle token-based authentication (from scan)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log('[CARE] Token-based auth, token:', token.substring(0, 10) + '...')

    // For token-based, we'll handle everything ourselves
    // No session required
  }

  // Try to get session (optional for scans)
  const session = await getServerSession(authOptions)
  if (session?.user) {
    userName = session.user.name || session.user.username || 'User'
    userId = session.user.id
    console.log('[CARE] Session found:', userName)
  } else {
    console.log('[CARE] No session, continuing as anonymous')
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
    } else {
      data.lastScanUser = userName
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
    } else {
      data.lastScanUser = userName
      data.lastScanAt = new Date().toISOString()
    }
  }

  // Update in memory (legacy system) - might not exist
  let tool = updateTool(params.hash, data, userId || 'anonymous', userName)

  // If tool doesn't exist in memory, create a minimal object for response
  if (!tool) {
    console.log('[CARE] Tool not in memory, will create in database')
    tool = {
      hash: params.hash,
      name: data.name || `Tool ${params.hash}`,
      category: 'Care Tools',
      qrData: `CARE_${params.hash}`,
      lastScanLieu: data.lastScanLieu,
      lastScanEtat: data.lastScanEtat,
      lastScanUser: data.lastScanUser,
      lastScanAt: data.lastScanAt || new Date().toISOString()
    }
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

  // Envoyer email à tous les admins si l'outil est cassé/abîmé (optionnel)
  if (data.state === 'Abîmé' || data.state === 'Problème') {
    try {
      await sendBrokenToolAlertToAdmins({
        toolName: tool.name,
        location: data.location || data.lastScanLieu,
        description: data.problemDescription,
        userName: userName,
        photoBuffer,
        photoType,
        prisma
      })
      console.log('[CARE] Email alert sent successfully')
    } catch (error) {
      console.error('[CARE] Failed to send email (non-blocking):', error.message)
      // Ne pas bloquer la réponse si l'email échoue
    }
  }

  console.log('[CARE] ✅ PATCH successful, returning tool')
  return Response.json({
    tool,
    success: true,
    dbSaved: dbSaveSuccess
  })
}