import { updateTool, getTool } from '@/lib/commun-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Configure route for larger body sizes (max 4MB due to Vercel limits)
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(req, { params }) {
  try {
    const tool = getTool(params.hash)
    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }
    return Response.json({ tool })
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

  try {
    const contentType = req.headers.get('content-type')
    let body
    let problemPhotoPath = null

    // Handle FormData for file uploads
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData()
      body = {}

      // Handle problem photo upload - Store in database instead of filesystem
      const problemPhoto = formData.get('problemPhoto')
      if (problemPhoto && problemPhoto.size > 0) {
        const bytes = await problemPhoto.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Store photo data in body for database storage
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

    const { name, location, state, weight, imoNumber, user, problemDescription, complementaryInfo, problemPhotoBuffer, problemPhotoType, ...otherFields } = body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (state !== undefined) updateData.state = state
    if (weight !== undefined) updateData.weight = weight
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription
    if (complementaryInfo !== undefined) updateData.complementaryInfo = complementaryInfo

    // Track user who made the modification
    if (user !== undefined) {
      updateData.lastScanUser = user
      updateData.lastScanAt = new Date().toISOString()
    }

    Object.assign(updateData, otherFields)

    // Update in memory (legacy system)
    const tool = updateTool(params.hash, updateData, session.user.name || 'user')

    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }

    // Save to Prisma database for persistence
    try {
      const { prisma } = await import('@/lib/prisma')

      // Create or update a log entry for Commun tools
      await prisma.log.create({
        data: {
          qrData: params.hash,
          lieu: location || 'Non spécifié',
          date: new Date(),
          actorName: user || session.user.name || 'user',
          etat: state || 'RAS',
          probleme: problemDescription || null,
          photo: problemPhotoBuffer || null,
          photoType: problemPhotoType || null,
        },
      })
    } catch (dbError) {
      console.error('Failed to persist to database:', dbError)
      // Continue even if database update fails
    }

    return Response.json({ tool })
  } catch (e) {
    console.error('Error updating tool:', e)
    return new Response('Server error', { status: 500 })
  }
}