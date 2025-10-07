import { updateTool, getTool } from '@/lib/commun-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
  const normalizedHash = normalizeHash(rawHash)

  try {
    let dbTool = await prisma.tool.findUnique({ where: { hash: rawHash } })
    if (!dbTool && rawHash !== normalizedHash) {
      dbTool = await prisma.tool.findUnique({ where: { hash: normalizedHash } })
    }

    if (dbTool) {
      return Response.json({
        tool: formatCommunTool({
          ...dbTool,
          lastScanBy: dbTool.lastScanUser || '',
        }),
      })
    }
  } catch (error) {
    console.error('Error fetching commun tool from database:', error)
  }

  try {
    const tool = getTool(normalizedHash)
    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }
    return Response.json({ tool: formatCommunTool(tool) })
  } catch (e) {
    console.error('Error fetching tool:', e)
    return new Response('Server error', { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'TECH')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rawHash = String(params.hash || '').trim()
  const normalizedHash = normalizeHash(rawHash)

  try {
    const contentType = req.headers.get('content-type')
    let body

    // Handle FormData for file uploads
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData()
      body = {}

      const problemPhoto = formData.get('problemPhoto')
      if (problemPhoto && problemPhoto.size > 0) {
        const bytes = await problemPhoto.arrayBuffer()
        const buffer = Buffer.from(bytes)
        body.problemPhotoBuffer = buffer
        body.problemPhotoType = problemPhoto.type
      }

      for (const [key, value] of formData.entries()) {
        if (key !== 'problemPhoto') {
          body[key] = value
        }
      }
    } else {
      body = await req.json()
    }

    const {
      name,
      location,
      state,
      weight,
      imoNumber,
      user,
      problemDescription,
      complementaryInfo,
      problemPhotoBuffer,
      problemPhotoType,
      ...otherFields
    } = body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (state !== undefined) updateData.state = state
    if (weight !== undefined) updateData.weight = weight
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription
    if (complementaryInfo !== undefined) updateData.complementaryInfo = complementaryInfo

    if (user !== undefined) {
      updateData.lastScanUser = user
      updateData.lastScanAt = new Date().toISOString()
    }

    Object.assign(updateData, otherFields)

    const tool = updateTool(normalizedHash, updateData, session.user.name || 'user')

    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }

    try {
      const prismaUpdateData = {}

      if (updateData.name !== undefined) prismaUpdateData.name = updateData.name

      const lastScanLieuValue =
        updateData.lastScanLieu ?? updateData.location ?? location
      if (lastScanLieuValue !== undefined) {
        prismaUpdateData.lastScanLieu = lastScanLieuValue
      }

      const lastScanEtatValue =
        updateData.lastScanEtat ?? updateData.state ?? state
      if (lastScanEtatValue !== undefined) {
        prismaUpdateData.lastScanEtat = lastScanEtatValue
      }

      if (updateData.lastScanAt) {
        const parsedDate = new Date(updateData.lastScanAt)
        if (!Number.isNaN(parsedDate.valueOf())) {
          prismaUpdateData.lastScanAt = parsedDate
        }
      }

      const lastScanUserValue =
        updateData.lastScanUser ?? updateData.lastScanBy ?? user
      if (lastScanUserValue !== undefined) {
        prismaUpdateData.lastScanUser = lastScanUserValue
      }

      if (updateData.weight !== undefined) prismaUpdateData.weight = updateData.weight
      if (updateData.imoNumber !== undefined) prismaUpdateData.imoNumber = updateData.imoNumber
      if (updateData.problemDescription !== undefined) prismaUpdateData.problemDescription = updateData.problemDescription
      if (updateData.complementaryInfo !== undefined) prismaUpdateData.complementaryInfo = updateData.complementaryInfo
      if (updateData.dimensionLength !== undefined) prismaUpdateData.dimensionLength = updateData.dimensionLength
      if (updateData.dimensionWidth !== undefined) prismaUpdateData.dimensionWidth = updateData.dimensionWidth
      if (updateData.dimensionHeight !== undefined) prismaUpdateData.dimensionHeight = updateData.dimensionHeight
      if (updateData.dimensionType !== undefined) prismaUpdateData.dimensionType = updateData.dimensionType
      if (updateData.client !== undefined) prismaUpdateData.client = updateData.client
      if (updateData.tracking !== undefined) prismaUpdateData.tracking = updateData.tracking
      if (updateData.transporteur !== undefined) prismaUpdateData.transporteur = updateData.transporteur
      if (updateData.problemPhotoPath !== undefined) prismaUpdateData.problemPhotoPath = updateData.problemPhotoPath

      const photoBuffer = problemPhotoBuffer ?? updateData.problemPhotoBuffer
      const photoType = problemPhotoType ?? updateData.problemPhotoType
      if (photoBuffer) {
        prismaUpdateData.problemPhotoBuffer = photoBuffer
        prismaUpdateData.problemPhotoType = photoType || null
      }

      await prisma.tool.upsert({
        where: { hash: normalizedHash },
        update: prismaUpdateData,
        create: {
          hash: normalizedHash,
          qrData: tool.qrData || rawHash || normalizedHash,
          name: tool.name || updateData.name || rawHash,
          category: 'COMMUN',
          ...prismaUpdateData,
        },
      })

      const actorName = user || session.user.name || 'user'
      let actorId = null
      if (session.user?.username) {
        const dbUser = await prisma.user.findUnique({
          where: { username: session.user.username },
        })
        if (dbUser) {
          actorId = dbUser.id
        }
      }

      await prisma.log.create({
        data: {
          qrData: normalizedHash,
          lieu: lastScanLieuValue || 'Non spécifié',
          date: new Date(),
          actorName,
          etat: lastScanEtatValue || 'RAS',
          probleme: problemDescription || updateData.problemDescription || null,
          photo: photoBuffer || null,
          photoType: photoType || null,
          createdById: actorId || undefined,
        },
      })
    } catch (dbError) {
      console.error('Failed to persist commun tool to database:', dbError)
    }

    return Response.json({ tool })
  } catch (e) {
    console.error('Error updating tool:', e)
    return new Response('Server error', { status: 500 })
  }
}
