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

    console.log('[COMMONS] Saving directly to Prisma database:', normalized)

    // Build update data
    const updateData = {
      lastScanAt: new Date(),
      lastScanUser: userName,
      lastScanLieu: location || null,
      lastScanEtat: state || 'RAS',
      problemDescription: problemDescription || null,
    }

    // Admin-only fields
    if (name !== undefined) updateData.name = name
    if (weight !== undefined) updateData.weight = weight
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber
    if (complementaryInfo !== undefined) updateData.complementaryInfo = complementaryInfo

    // Photo
    if (problemPhotoBuffer) {
      updateData.problemPhotoBuffer = problemPhotoBuffer
      updateData.problemPhotoType = problemPhotoType
    }

    console.log('[COMMONS] Update data:', {
      hash: normalized,
      user: updateData.lastScanUser,
      lieu: updateData.lastScanLieu,
      etat: updateData.lastScanEtat
    })

    // UPSERT: Create if doesn't exist, update if exists
    console.log('[COMMONS] Executing upsert...')
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

    console.log('[COMMONS] ✅ Database save SUCCESS:', tool.id, tool.name)

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