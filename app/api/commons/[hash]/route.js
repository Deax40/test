import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Configure route for larger body sizes (max 4MB due to Vercel limits)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req, { params }) {
  // SKIP MEMORY - Read directly from Prisma database
  console.log('[COMMONS] GET request for hash:', params.hash)

  try {
    const normalized = String(params.hash).trim().toUpperCase()
    console.log('[COMMONS] Reading from Prisma database:', normalized)

    const tool = await prisma.tool.findUnique({
      where: { hash: normalized }
    })

    if (!tool) {
      console.log('[COMMONS] ⚠️ Tool not found in database')
      return new Response('Tool not found', { status: 404 })
    }

    console.log('[COMMONS] ✅ Tool found in database:', tool.name)
    return Response.json({ tool })
  } catch (e) {
    console.error('[COMMONS] ❌ Error fetching tool:', e.message)
    return new Response('Server error', { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'TECH')) {
    return new Response('Unauthorized', { status: 401 })
  }

  console.log('=== [COMMONS] PATCH REQUEST START ===')
  console.log('[COMMONS] Hash:', params.hash)

  try {
    const contentType = req.headers.get('content-type')
    let body

    // Handle FormData for file uploads
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData()
      body = {}

      // Handle problem photo upload
      const problemPhoto = formData.get('problemPhoto')
      if (problemPhoto && problemPhoto.size > 0) {
        const bytes = await problemPhoto.arrayBuffer()
        const buffer = Buffer.from(bytes)
        body.problemPhotoBuffer = buffer
        body.problemPhotoType = problemPhoto.type
        console.log('[COMMONS] Photo included, size:', buffer.length)
      }

      for (const [key, value] of formData.entries()) {
        if (key !== 'problemPhoto') {
          body[key] = value
        }
      }
    } else {
      body = await req.json()
    }

    const { name, location, state, weight, imoNumber, user, problemDescription, complementaryInfo, problemPhotoBuffer, problemPhotoType } = body

    const normalized = String(params.hash).trim().toUpperCase()
    const userName = user || session.user.name || 'user'

    console.log('[COMMONS] ====== START DATABASE OPERATION ======')
    console.log('[COMMONS] Normalized hash:', normalized)
    console.log('[COMMONS] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
    })

    // Build update data
    const updateData = {
      lastScanAt: new Date(),
      lastScanUser: userName,
      lastScanLieu: location || body.lastScanLieu || null,
      lastScanEtat: state || body.lastScanEtat || 'RAS',
      problemDescription: problemDescription || body.problemDescription || null,
    }

    console.log('[COMMONS] === RECEIVED DATA ===')
    console.log('[COMMONS] lastScanEtat:', updateData.lastScanEtat)
    console.log('[COMMONS] problemDescription:', updateData.problemDescription)
    console.log('[COMMONS] hasPhoto:', !!problemPhotoBuffer)

    // Admin-only fields
    if (name !== undefined) updateData.name = name !== null && name !== '' ? String(name).trim() : null
    if (weight !== undefined) updateData.weight = weight !== null && weight !== '' ? String(weight).trim() : null
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber !== null && imoNumber !== '' ? String(imoNumber).trim() : null
    if (complementaryInfo !== undefined) updateData.complementaryInfo = complementaryInfo !== null && complementaryInfo !== '' ? String(complementaryInfo).trim() : null

    // Client/tracking fields
    if (body.client !== undefined) updateData.client = body.client !== null && body.client !== '' ? String(body.client).trim() : null
    if (body.transporteur !== undefined) updateData.transporteur = body.transporteur !== null && body.transporteur !== '' ? String(body.transporteur).trim() : null
    if (body.tracking !== undefined) updateData.tracking = body.tracking !== null && body.tracking !== '' ? String(body.tracking).trim() : null

    // Dimensions
    if (body.dimensionLength !== undefined) updateData.dimensionLength = body.dimensionLength !== null && body.dimensionLength !== '' ? String(body.dimensionLength).trim() : null
    if (body.dimensionWidth !== undefined) updateData.dimensionWidth = body.dimensionWidth !== null && body.dimensionWidth !== '' ? String(body.dimensionWidth).trim() : null
    if (body.dimensionHeight !== undefined) updateData.dimensionHeight = body.dimensionHeight !== null && body.dimensionHeight !== '' ? String(body.dimensionHeight).trim() : null
    if (body.dimensionType !== undefined) updateData.dimensionType = body.dimensionType !== null && body.dimensionType !== '' ? String(body.dimensionType).trim() : 'piece'

    // Photo
    if (problemPhotoBuffer) {
      updateData.problemPhotoBuffer = problemPhotoBuffer
      updateData.problemPhotoType = problemPhotoType
    }

    console.log('[COMMONS] ========== COMPLETE UPDATE DATA ==========')
    console.log('[COMMONS] Update data:', JSON.stringify({
      hash: normalized,
      user: updateData.lastScanUser,
      lieu: updateData.lastScanLieu,
      etat: updateData.lastScanEtat,
      weight: updateData.weight,
      imoNumber: updateData.imoNumber,
      dimensionLength: updateData.dimensionLength,
      dimensionWidth: updateData.dimensionWidth,
      dimensionHeight: updateData.dimensionHeight,
      dimensionType: updateData.dimensionType,
      client: updateData.client,
      tracking: updateData.tracking,
      transporteur: updateData.transporteur,
      complementaryInfo: updateData.complementaryInfo,
      hasPhoto: !!updateData.problemPhotoBuffer,
    }, null, 2))
    console.log('[COMMONS] =========================================')

    // UPSERT: Create if doesn't exist, update if exists
    console.log('[COMMONS] Executing upsert operation...')
    const startTime = Date.now()

    const tool = await prisma.tool.upsert({
      where: { hash: normalized },
      update: updateData,
      create: {
        hash: normalized,
        name: name || `Tool ${normalized}`,
        category: 'Commun Tools',
        qrData: `COMMUN_${normalized}`,
        ...updateData,
      },
    })

    const duration = Date.now() - startTime
    console.log('[COMMONS] ✅ Database save SUCCESS in', duration, 'ms')
    console.log('[COMMONS] === SAVED TOOL ===')
    console.log('[COMMONS] Saved tool:', JSON.stringify({
      id: tool.id,
      name: tool.name,
      hash: tool.hash,
      lastScanAt: tool.lastScanAt,
      lastScanUser: tool.lastScanUser,
      lastScanEtat: tool.lastScanEtat,
      lastScanLieu: tool.lastScanLieu,
      problemDescription: tool.problemDescription,
      hasPhoto: !!tool.problemPhotoBuffer
    }, null, 2))

    // Also create a log entry
    try {
      await prisma.log.create({
        data: {
          qrData: normalized,
          lieu: location || 'Non spécifié',
          date: new Date(),
          actorName: userName,
          etat: state || 'RAS',
          probleme: problemDescription || null,
          photo: problemPhotoBuffer || null,
          photoType: problemPhotoType || null,
        },
      })
      console.log('[COMMONS] ✅ Log created')
    } catch (logError) {
      console.error('[COMMONS] ⚠️ Failed to create log (non-blocking):', logError.message)
    }

    // Create scan history entry
    try {
      await prisma.scanHistory.create({
        data: {
          toolHash: normalized,
          scanLieu: updateData.lastScanLieu || 'Non spécifié',
          scanEtat: updateData.lastScanEtat || 'RAS',
          scanUser: userName,
          client: updateData.client || null,
          tracking: updateData.tracking || null,
          transporteur: updateData.transporteur || null,
          problemDescription: updateData.problemDescription || null,
        },
      })
      console.log('[COMMONS] ✅ Scan history created')
    } catch (historyError) {
      console.error('[COMMONS] ⚠️ Failed to create scan history (non-blocking):', historyError.message)
    }

    console.log('[COMMONS] ✅ PATCH successful, returning tool')

    return Response.json({
      tool: {
        ...tool,
        lastScanAt: tool.lastScanAt?.toISOString() || null,
        createdAt: tool.createdAt?.toISOString() || null
      },
      success: true,
      saved: true
    })
  } catch (e) {
    console.error('[COMMONS] ❌ Error updating tool:', e.message)
    console.error('[COMMONS] Stack:', e.stack)
    return Response.json({
      error: 'Database save failed',
      details: e.message
    }, { status: 500 })
  }
}