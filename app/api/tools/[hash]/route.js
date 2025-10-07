import { getTool, patchTool, consumeToken, createToken } from '@/lib/commun-data'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendProblemNotification, sendBrokenToolAlertToAdmins } from '@/lib/email'

export async function GET(req, { params }) {
  const hash = String(params.hash || '').trim().toLowerCase()
  const tool = getTool(hash)
  if (!tool) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const hash = String(params.hash || '').trim().toLowerCase()
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  let userId = null
  if (token) {
    userId = consumeToken(token, hash)
    if (!userId) {
      return new Response('Forbidden', { status: 403 })
    }
  }

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

  const patch = {}
  if (typeof data.name === 'string') patch.name = data.name.trim()
  if (typeof data.location === 'string') {
    patch.location = data.location.trim()
    patch.lastScanLieu = data.location.trim()
  }
  if (typeof data.state === 'string') {
    patch.state = data.state.trim()
    patch.lastScanEtat = data.state.trim()
  }
  if (typeof data.weight === 'string') patch.weight = data.weight.trim()
  if (typeof data.imoNumber === 'string') patch.imoNumber = data.imoNumber.trim()
  if (typeof data.user === 'string') {
    patch.lastScanBy = data.user.trim()
    patch.lastScanAt = new Date().toISOString()
  }
  if (typeof data.lastScanBy === 'string') {
    patch.lastScanBy = data.lastScanBy.trim()
    patch.lastScanAt = new Date().toISOString()
  }
  if (typeof data.client === 'string') patch.client = data.client.trim()
  if (typeof data.transporteur === 'string') patch.transporteur = data.transporteur.trim()
  if (typeof data.tracking === 'string') patch.tracking = data.tracking.trim()
  if (typeof data.problemDescription === 'string') patch.problemDescription = data.problemDescription.trim()
  if (problemPhotoPath) patch.problemPhotoPath = problemPhotoPath

  const updated = patchTool(hash, patch, userId || '')
  if (!updated) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }

  // Create a log entry for the scan
  try {
    console.log('[COMMUN] Attempting to save log, session user:', session.user?.name || session.user?.username)

    // Find user by name or username or email
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
      console.log('[COMMUN] User found:', user.id, user.name)
      const logResult = await prisma.log.create({
        data: {
          qrData: hash,
          lieu: data.location || '',
          date: new Date(),
          actorName: user.name,
          etat: data.state || 'RAS',
          probleme: data.state === 'Problème' ? data.problemDescription : null,
          photo: problemPhoto?.data || null,
          photoType: problemPhoto?.type || null,
          createdById: user.id
        }
      })
      console.log('[COMMUN] Log created successfully:', logResult.id)

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
      }

      // Send email if there's a problem
      if (data.state === 'Problème') {
        await sendProblemNotification({
          toolName: updated.name,
          location: data.location,
          description: data.problemDescription,
          userName: user.name,
          userEmail: user.email,
          photoBuffer: problemPhoto?.data,
          photoType: problemPhoto?.type
        })
      }

      // Envoyer email à tous les admins si l'outil est cassé/abîmé
      if (data.state === 'Abîmé' || data.state === 'Problème') {
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
        } catch (error) {
          console.error('Failed to send broken tool alert to admins:', error)
        }
      }
    } else {
      console.error('[COMMUN] User not found in database for session:', session.user)
    }
  } catch (e) {
    console.error('[COMMUN] Error creating log entry:', e.message)
    console.error('[COMMUN] Full error:', e)
    // Return error so user knows
    return Response.json({
      error: 'Failed to save changes',
      details: e.message,
      tool: updated
    }, { status: 500 })
  }

  console.log('Tool updated', { hash, patch, userId })
  const response = { tool: updated }
  if (userId) {
    response.editSessionToken = createToken(hash, userId)
  }
  return Response.json(response)
}

