import { updateTool, getTool } from '@/lib/commun-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

      // Handle problem photo upload
      const problemPhoto = formData.get('problemPhoto')
      if (problemPhoto && problemPhoto.size > 0) {
        const { writeFile, mkdir } = await import('fs/promises')
        const path = await import('path')

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'problem-photos')
        await mkdir(uploadsDir, { recursive: true })

        const fileName = `${Date.now()}_${params.hash}_${problemPhoto.name}`
        const filePath = path.join(uploadsDir, fileName)

        const bytes = await problemPhoto.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        problemPhotoPath = `/uploads/problem-photos/${fileName}`
      }

      for (const [key, value] of formData.entries()) {
        if (key !== 'problemPhoto') {
          body[key] = value
        }
      }
    } else {
      body = await req.json()
    }

    const { name, location, state, weight, imoNumber, user, problemDescription, complementaryInfo, ...otherFields } = body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (location !== undefined) updateData.location = location
    if (state !== undefined) updateData.state = state
    if (weight !== undefined) updateData.weight = weight
    if (imoNumber !== undefined) updateData.imoNumber = imoNumber
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription
    if (complementaryInfo !== undefined) updateData.complementaryInfo = complementaryInfo

    // Add problem photo path if uploaded
    if (problemPhotoPath) {
      updateData.problemPhotoPath = problemPhotoPath
    }

    // Track user who made the modification
    if (user !== undefined) {
      updateData.lastScanUser = user
      updateData.lastScanAt = new Date().toISOString()
    }

    Object.assign(updateData, otherFields)

    const tool = updateTool(params.hash, updateData, session.user.name || 'user')

    if (!tool) {
      return new Response('Tool not found', { status: 404 })
    }

    return Response.json({ tool })
  } catch (e) {
    console.error('Error updating tool:', e)
    return new Response('Server error', { status: 500 })
  }
}