import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendProblemNotification, sendBrokenToolAlertToAdmins } from '@/lib/email'

export async function GET(req, { params }) {
  // SKIP MEMORY - Read directly from Prisma
  console.log('[TOOLS] GET request for hash:', params.hash)

  try {
    const normalized = String(params.hash || '').trim().toUpperCase()

    const tool = await prisma.tool.findUnique({
      where: { hash: normalized }
    })

    if (!tool) {
      console.log('[TOOLS] ⚠️ Tool not found in database')
      return Response.json({ error: 'tool_not_found' }, { status: 404 })
    }

    console.log('[TOOLS] ✅ Tool found:', tool.name)
    return Response.json(tool)
  } catch (error) {
    console.error('[TOOLS] ❌ Error:', error.message)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  console.log('=== [TOOLS] PATCH REQUEST START ===')
  console.log('[TOOLS] Hash:', params.hash)

  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  let data = {}
  let problemPhoto = null
  let problemPhotoPath = null

  try {
    const formData = await req.formData()

    // Extract form fields
    data.name = formData.get('name') || ''
    data.location = formData.get('location') || ''
    data.state = formData.get('state') || 'RAS'
    data.user = formData.get('user') || ''
    data.weight = formData.get('weight') || ''
    data.imoNumber = formData.get('imoNumber') || ''
    data.problemDescription = formData.get('problemDescription') || ''
    data.shippingStatus = formData.get('shippingStatus') || ''
    data.client = formData.get('client') || ''
    data.transporteur = formData.get('transporteur') || ''
    data.tracking = formData.get('tracking') || ''

    // Handle photo upload - Store in memory for database
    const photoFile = formData.get('problemPhoto')
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      problemPhoto = {
        data: buffer,
        type: photoFile.type
      }
      console.log('[COMMUN] Photo received, size:', buffer.length, 'bytes')
    }
  } catch (e) {
    // Fallback to JSON
    try {
      data = await req.json()
    } catch {
      data = {}
    }
  }

  if (typeof data !== 'object' || data === null) {
    data = {}
  }

  const normalized = String(params.hash || '').trim().toUpperCase()
  const userName = data.user || session.user.name || session.user.username || 'user'

  console.log('[TOOLS] Saving directly to Prisma database:', normalized)

  // Build update data
  const updateData = {
    lastScanAt: new Date(),
    lastScanUser: userName,
    lastScanLieu: (data.location || '').trim() || null,
    lastScanEtat: (data.state || 'RAS').trim(),
    problemDescription: (data.problemDescription || '').trim() || null,
  }

  // Admin-only fields
  if (typeof data.name === 'string' && data.name.trim()) updateData.name = data.name.trim()
  if (typeof data.weight === 'string') updateData.weight = data.weight.trim() || null
  if (typeof data.imoNumber === 'string') updateData.imoNumber = data.imoNumber.trim() || null
  if (typeof data.client === 'string') updateData.client = data.client.trim() || null
  if (typeof data.transporteur === 'string') updateData.transporteur = data.transporteur.trim() || null
  if (typeof data.tracking === 'string') updateData.tracking = data.tracking.trim() || null

  // Photo
  if (problemPhoto) {
    updateData.problemPhotoBuffer = problemPhoto.data
    updateData.problemPhotoType = problemPhoto.type
    console.log('[TOOLS] Photo included, size:', problemPhoto.data.length)
  }

  console.log('[TOOLS] Update data:', {
    hash: normalized,
    user: updateData.lastScanUser,
    lieu: updateData.lastScanLieu,
    etat: updateData.lastScanEtat
  })

  let updated
  try {
    // UPSERT: Create if doesn't exist, update if exists
    console.log('[TOOLS] Executing upsert...')
    updated = await prisma.tool.upsert({
      where: { hash: normalized },
      update: updateData,
      create: {
        hash: normalized,
        name: data.name || `Tool ${normalized}`,
        category: 'Commun Tools',
        qrData: `TOOL_${normalized}`,
        ...updateData,
      },
    })

    console.log('[TOOLS] ✅ Database save SUCCESS:', updated.id, updated.name)
  } catch (dbError) {
    console.error('[TOOLS] ❌ Database save FAILED:', dbError.message)
    return Response.json({
      error: 'Database save failed',
      details: dbError.message
    }, { status: 500 })
  }

  // Create a log entry
  try {
    console.log('[TOOLS] Creating log entry...')

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: session.user.username || '' },
          { name: session.user.name || '' },
          { email: session.user.email || '' }
        ]
      }
    })

    if (user) {
      console.log('[TOOLS] User found:', user.id, user.name)
      await prisma.log.create({
        data: {
          qrData: normalized,
          lieu: data.location || 'Non spécifié',
          date: new Date(),
          actorName: user.name,
          etat: data.state || 'RAS',
          probleme: data.state === 'Problème' ? data.problemDescription : null,
          photo: problemPhoto?.data || null,
          photoType: problemPhoto?.type || null,
          createdById: user.id
        }
      })
      console.log('[TOOLS] ✅ Log created')

      // Create tool log for shipping status
      if (data.shippingStatus) {
        await prisma.toolLog.create({
          data: {
            tool: updated.name,
            status: data.shippingStatus,
            lieu: data.location || '',
            client: data.client || '',
            etat: data.state || 'RAS',
            transporteur: data.transporteur || '',
            tracking: data.tracking || '',
            createdById: user.id
          }
        })
        console.log('[TOOLS] ✅ Tool log created')
      }

      // Send emails if needed (non-blocking)
      if (data.state === 'Problème' || data.state === 'Abîmé') {
        try {
          await sendBrokenToolAlertToAdmins({
            toolName: updated.name,
            location: data.location,
            description: data.problemDescription,
            userName: user.name,
            photoBuffer: problemPhoto?.data,
            photoType: problemPhoto?.type,
            prisma
          })
          console.log('[TOOLS] ✅ Email sent')
        } catch (error) {
          console.error('[TOOLS] ⚠️ Email failed (non-blocking):', error.message)
        }
      }
    } else {
      console.error('[TOOLS] ⚠️ User not found in database')
    }
  } catch (e) {
    console.error('[TOOLS] ⚠️ Error creating log (non-blocking):', e.message)
    // Don't fail the request if log creation fails
  }

  console.log('[TOOLS] ✅ PATCH successful, returning tool')

  return Response.json({
    tool: {
      ...updated,
      lastScanAt: updated.lastScanAt?.toISOString() || null,
      createdAt: updated.createdAt?.toISOString() || null
    },
    success: true,
    saved: true
  })
}

