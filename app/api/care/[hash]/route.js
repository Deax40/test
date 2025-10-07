import { getTool, updateTool, updateToolWithToken } from '@/lib/care-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBrokenToolAlertToAdmins } from '@/lib/email'
import { prisma } from '@/lib/prisma'

// Configure route for larger body sizes (max 4MB due to Vercel limits)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request, { params }) {
  // SKIP MEMORY - Read directly from Prisma database
  // On Vercel, memory doesn't persist between requests
  console.log('[CARE] GET request for hash:', params.hash)

  let tool = null

  try {
    const normalized = String(params.hash).trim().toUpperCase()
    console.log('[CARE] Reading from Prisma database:', normalized)

    tool = await prisma.tool.findUnique({
      where: { hash: normalized }
    })

    if (tool) {
      console.log('[CARE] ✅ Tool found in database:', tool.name)
    } else {
      console.log('[CARE] ⚠️ Tool not found in database')
    }
  } catch (error) {
    console.error('[CARE] ❌ Error fetching tool from database:', error.message)
    return Response.json({ error: 'Database error', details: error.message }, { status: 500 })
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

  // SKIP MEMORY SYSTEM - GO DIRECTLY TO PRISMA
  // On Vercel, memory and file systems don't persist
  // We MUST use Prisma as the source of truth

  console.log('=== [CARE] PATCH REQUEST START ===')
  console.log('[CARE] Hash:', params.hash)
  console.log('[CARE] Environment:', process.env.NODE_ENV)
  console.log('[CARE] Database configured:', !!process.env.DATABASE_URL)
  console.log('[CARE] Prisma client available:', !!prisma)
  console.log('[CARE] Saving directly to Prisma database:', params.hash)

  let tool = null

  try {
    const normalized = String(params.hash).trim().toUpperCase()
    console.log('[CARE] Normalized hash:', normalized)

    const updateData = {
      lastScanAt: data.lastScanAt ? new Date(data.lastScanAt) : new Date(),
      lastScanUser: data.lastScanUser || userName || 'Anonymous',
    }

    const setIfPresent = (field, value, transform = (v) => v ?? null) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        updateData[field] = transform(value)
      }
    }

    setIfPresent('lastScanLieu', data.lastScanLieu)
    setIfPresent('lastScanEtat', data.lastScanEtat, (v) => v ?? 'RAS')
    setIfPresent('problemDescription', data.problemDescription)
    setIfPresent('typeEnvoi', data.typeEnvoi)
    setIfPresent('ouEstAppareil', data.ouEstAppareil)
    setIfPresent('dimensionLength', data.dimensionLength)
    setIfPresent('dimensionWidth', data.dimensionWidth)
    setIfPresent('dimensionHeight', data.dimensionHeight)
    setIfPresent('dimensionType', data.dimensionType)
    setIfPresent('weight', data.weight)
    setIfPresent('imoNumber', data.imoNumber)
    setIfPresent('complementaryInfo', data.complementaryInfo)
    setIfPresent('transporteur', data.transporteur)
    setIfPresent('tracking', data.tracking)
    setIfPresent('client', data.client)

    // Add photo to database if present
    if (data.problemPhotoBuffer) {
      updateData.problemPhotoBuffer = data.problemPhotoBuffer
      updateData.problemPhotoType = data.problemPhotoType
      console.log('[CARE] Photo included, size:', data.problemPhotoBuffer.length)
    }

    console.log('[CARE] Update data:', {
      hash: normalized,
      user: updateData.lastScanUser,
      lieu: updateData.lastScanLieu,
      etat: updateData.lastScanEtat
    })

    // Test connection first
    console.log('[CARE] Testing Prisma connection...')
    await prisma.$connect()
    console.log('[CARE] ✅ Connection test passed')

    // UPSERT: Create if doesn't exist, update if exists
    console.log('[CARE] Executing upsert...')
    tool = await prisma.tool.upsert({
      where: { hash: normalized },
      update: updateData,
      create: {
        hash: normalized,
        name: data.name || `Tool ${normalized}`,
        category: 'CARE',
        qrData: `CARE_${normalized}`,
        typeEnvoi: data.typeEnvoi || 'Envoi',
        ouEstAppareil: data.ouEstAppareil || null,
        dimensionLength: data.dimensionLength || null,
        dimensionWidth: data.dimensionWidth || null,
        dimensionHeight: data.dimensionHeight || null,
        dimensionType: data.dimensionType || null,
        weight: data.weight || null,
        imoNumber: data.imoNumber || null,
        complementaryInfo: data.complementaryInfo || null,
        transporteur: data.transporteur || null,
        tracking: data.tracking || null,
        client: data.client || null,
        ...updateData,
      },
    })

    console.log('[CARE] ✅ Database save SUCCESS:', tool.id, tool.name)

  } catch (dbError) {
    console.error('[CARE] ❌ Database save FAILED:', dbError.message)
    console.error('[CARE] Stack:', dbError.stack)

    // Return detailed error to client
    return Response.json({
      error: 'Database save failed',
      details: dbError.message,
      code: dbError.code
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

  // Return the tool from database (source of truth)
  return Response.json({
    tool: {
      ...tool,
      // Convert dates to ISO strings for JSON
      lastScanAt: tool.lastScanAt?.toISOString() || null,
      createdAt: tool.createdAt?.toISOString() || null
    },
    success: true,
    saved: true
  })
}