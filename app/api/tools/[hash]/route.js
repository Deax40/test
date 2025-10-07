import { getTool, patchTool, consumeToken, createToken } from '@/lib/commun-data'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendProblemNotification, sendBrokenToolAlertToAdmins } from '@/lib/email'

function normalizeHash(hash) {
  return String(hash || '').trim().toLowerCase()
}

function formatCommunTool(tool) {
  if (!tool) return tool
  return {
    ...tool,
    location: tool.location ?? tool.lastScanLieu ?? '',
    state: tool.state ?? tool.lastScanEtat ?? '',
    lastScanBy: tool.lastScanBy ?? tool.lastScanUser ?? '',
  }
}

export async function GET(req, { params }) {
  const rawHash = String(params.hash || '').trim()
  const hash = normalizeHash(rawHash)

  try {
    let dbTool = await prisma.tool.findUnique({ where: { hash: rawHash } })
    if (!dbTool && rawHash !== hash) {
      dbTool = await prisma.tool.findUnique({ where: { hash } })
    }

    if (dbTool) {
      return Response.json(
        formatCommunTool({
          ...dbTool,
          lastScanBy: dbTool.lastScanUser || '',
        })
      )
    }
  } catch (error) {
    console.error('Failed to load commun tool from database:', error)
  }

  const tool = getTool(hash)
  if (!tool) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const rawHash = String(params.hash || '').trim()
  const hash = normalizeHash(rawHash)

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

    data.name = formData.get('name') || ''
    data.location = formData.get('location') || ''
    data.lastScanLieu = formData.get('lastScanLieu') || ''
    data.state = formData.get('state') || formData.get('lastScanEtat') || 'RAS'
    data.lastScanEtat = formData.get('lastScanEtat') || ''
    data.user = formData.get('user') || ''
    data.lastScanBy = formData.get('lastScanBy') || ''
    data.lastScanUser = formData.get('lastScanUser') || ''
    data.weight = formData.get('weight') || ''
    data.imoNumber = formData.get('imoNumber') || ''
    data.problemDescription = formData.get('problemDescription') || ''
    data.complementaryInfo = formData.get('complementaryInfo') || ''
    data.shippingStatus = formData.get('shippingStatus') || ''
    data.client = formData.get('client') || ''
    data.transporteur = formData.get('transporteur') || ''
    data.tracking = formData.get('tracking') || ''
    data.dimensionLength = formData.get('dimensionLength') || ''
    data.dimensionWidth = formData.get('dimensionWidth') || ''
    data.dimensionHeight = formData.get('dimensionHeight') || ''
    data.dimensionType = formData.get('dimensionType') || ''

    const photoFile = formData.get('problemPhoto')
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      const { writeFile, mkdir } = await import('fs/promises')
      const path = await import('path')

      const uploadsDir = path.join(process.cwd(), 'uploads', 'commun-photos')
      await mkdir(uploadsDir, { recursive: true })

      const fileName = `${Date.now()}_${hash}_${photoFile.name}`
      const filePath = path.join(uploadsDir, fileName)

      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      problemPhotoPath = `/uploads/commun-photos/${fileName}`
      problemPhoto = {
        data: buffer,
        type: photoFile.type,
      }
    }
  } catch (e) {
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
  if (typeof data.location === 'string' && data.location.trim()) {
    patch.location = data.location.trim()
    patch.lastScanLieu = data.location.trim()
  }
  if (typeof data.lastScanLieu === 'string' && data.lastScanLieu.trim()) {
    patch.lastScanLieu = data.lastScanLieu.trim()
    if (!patch.location) {
      patch.location = patch.lastScanLieu
    }
  }
  if (typeof data.state === 'string') {
    patch.state = data.state.trim()
    patch.lastScanEtat = data.state.trim()
  }
  if (typeof data.lastScanEtat === 'string' && data.lastScanEtat.trim()) {
    patch.lastScanEtat = data.lastScanEtat.trim()
  }
  if (typeof data.weight === 'string') patch.weight = data.weight.trim()
  if (typeof data.imoNumber === 'string') patch.imoNumber = data.imoNumber.trim()

  const userFromData = typeof data.user === 'string' ? data.user.trim() : ''
  const explicitLastScanBy = typeof data.lastScanBy === 'string' ? data.lastScanBy.trim() : ''
  const explicitLastScanUser = typeof data.lastScanUser === 'string' ? data.lastScanUser.trim() : ''

  if (userFromData) {
    patch.lastScanBy = userFromData
    patch.lastScanAt = new Date().toISOString()
  }
  if (explicitLastScanBy) {
    patch.lastScanBy = explicitLastScanBy
    patch.lastScanAt = new Date().toISOString()
  } else if (explicitLastScanUser && !patch.lastScanBy) {
    patch.lastScanBy = explicitLastScanUser
    patch.lastScanAt = new Date().toISOString()
  }

  if (typeof data.client === 'string') patch.client = data.client.trim()
  if (typeof data.transporteur === 'string') patch.transporteur = data.transporteur.trim()
  if (typeof data.tracking === 'string') patch.tracking = data.tracking.trim()
  if (typeof data.problemDescription === 'string') patch.problemDescription = data.problemDescription.trim()
  if (typeof data.complementaryInfo === 'string') patch.complementaryInfo = data.complementaryInfo.trim()
  if (typeof data.dimensionLength === 'string') patch.dimensionLength = data.dimensionLength.trim()
  if (typeof data.dimensionWidth === 'string') patch.dimensionWidth = data.dimensionWidth.trim()
  if (typeof data.dimensionHeight === 'string') patch.dimensionHeight = data.dimensionHeight.trim()
  if (typeof data.dimensionType === 'string') patch.dimensionType = data.dimensionType.trim()
  if (problemPhotoPath) patch.problemPhotoPath = problemPhotoPath

  const updated = patchTool(hash, patch, userId || '')
  if (!updated) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }

  const lastScanLieuValue =
    patch.lastScanLieu ?? patch.location ?? data.lastScanLieu ?? data.location ?? ''
  const lastScanEtatValue =
    patch.lastScanEtat ?? patch.state ?? data.lastScanEtat ?? data.state ?? 'RAS'
  const lastScanAtIso = patch.lastScanAt ?? data.lastScanAt ?? null
  let lastScanUserValue = patch.lastScanBy
  if (!lastScanUserValue) {
    lastScanUserValue =
      explicitLastScanBy || userFromData || explicitLastScanUser || ''
  }

  try {
    const prismaUpdateData = {}

    if (patch.name !== undefined) prismaUpdateData.name = patch.name
    if (lastScanLieuValue) prismaUpdateData.lastScanLieu = lastScanLieuValue
    if (lastScanEtatValue) prismaUpdateData.lastScanEtat = lastScanEtatValue

    if (lastScanAtIso) {
      const parsedDate = new Date(lastScanAtIso)
      if (!Number.isNaN(parsedDate.valueOf())) {
        prismaUpdateData.lastScanAt = parsedDate
      }
    }

    if (lastScanUserValue) prismaUpdateData.lastScanUser = lastScanUserValue
    if (patch.weight !== undefined) prismaUpdateData.weight = patch.weight
    if (patch.imoNumber !== undefined) prismaUpdateData.imoNumber = patch.imoNumber
    if (patch.problemDescription !== undefined) prismaUpdateData.problemDescription = patch.problemDescription
    if (patch.complementaryInfo !== undefined) prismaUpdateData.complementaryInfo = patch.complementaryInfo
    if (patch.dimensionLength !== undefined) prismaUpdateData.dimensionLength = patch.dimensionLength
    if (patch.dimensionWidth !== undefined) prismaUpdateData.dimensionWidth = patch.dimensionWidth
    if (patch.dimensionHeight !== undefined) prismaUpdateData.dimensionHeight = patch.dimensionHeight
    if (patch.dimensionType !== undefined) prismaUpdateData.dimensionType = patch.dimensionType
    if (patch.client !== undefined) prismaUpdateData.client = patch.client
    if (patch.tracking !== undefined) prismaUpdateData.tracking = patch.tracking
    if (patch.transporteur !== undefined) prismaUpdateData.transporteur = patch.transporteur
    if (patch.problemPhotoPath !== undefined) prismaUpdateData.problemPhotoPath = patch.problemPhotoPath

    const photoBuffer = problemPhoto?.data || data.problemPhotoBuffer || null
    const photoType = problemPhoto?.type || data.problemPhotoType || null
    if (photoBuffer) {
      prismaUpdateData.problemPhotoBuffer = photoBuffer
      prismaUpdateData.problemPhotoType = photoType
    }

    await prisma.tool.upsert({
      where: { hash },
      update: prismaUpdateData,
      create: {
        hash,
        qrData: updated.qrData || rawHash || hash,
        name: updated.name || patch.name || rawHash,
        category: updated.category || 'COMMUN',
        ...prismaUpdateData,
      },
    })
  } catch (error) {
    console.error('Failed to persist commun tool to database:', error)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    })

    if (user) {
      await prisma.log.create({
        data: {
          qrData: hash,
          lieu: lastScanLieuValue,
          date: new Date(),
          actorName: user.name,
          etat: lastScanEtatValue || 'RAS',
          probleme: lastScanEtatValue === 'Problème' ? patch.problemDescription || data.problemDescription || null : null,
          photo: problemPhoto?.data || null,
          photoType: problemPhoto?.type || null,
          createdById: user.id,
        },
      })

      if (data.shippingStatus) {
        await prisma.toolLog.create({
          data: {
            tool: updated.name,
            status: data.shippingStatus,
            lieu: lastScanLieuValue,
            client: data.client || '',
            etat: lastScanEtatValue || 'RAS',
            transporteur: data.transporteur || '',
            tracking: data.tracking || '',
            createdById: user.id,
          },
        })
      }

      if (lastScanEtatValue === 'Problème') {
        await sendProblemNotification({
          toolName: updated.name,
          location: lastScanLieuValue,
          description: patch.problemDescription || data.problemDescription,
          userName: user.name,
          userEmail: user.email,
          photoBuffer: problemPhoto?.data,
          photoType: problemPhoto?.type,
        })
      }

      if (lastScanEtatValue === 'Abîmé' || lastScanEtatValue === 'Problème') {
        try {
          await sendBrokenToolAlertToAdmins({
            toolName: updated.name,
            location: lastScanLieuValue,
            description: patch.problemDescription || data.problemDescription,
            userName: user.name,
            photoBuffer: problemPhoto?.data,
            photoType: problemPhoto?.type,
            prisma,
          })
        } catch (error) {
          console.error('Failed to send broken tool alert to admins:', error)
        }
      }
    }
  } catch (e) {
    console.error('Error creating log entry:', e)
  }

  console.log('Tool updated', { hash, patch, userId })
  const response = { tool: updated }
  if (userId) {
    response.editSessionToken = createToken(hash, userId)
  }
  return Response.json(response)
}

