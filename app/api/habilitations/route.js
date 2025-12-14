import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')

  // Si l'utilisateur est admin ET qu'aucun userId spécifique n'est demandé, retourner TOUTES les habilitations
  if (session.user?.role === 'ADMIN' && !userIdParam) {
    const habilitations = await prisma.habilitation.findMany({
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return Response.json({ habilitations })
  }

  // Sinon, filtrer par userId
  let userId
  if (userIdParam && session.user?.role === 'ADMIN') {
    userId = userIdParam
  } else {
    const user = await prisma.user.findUnique({ where: { username: session.user.username } })
    if (!user) return new Response('User not found', { status: 404 })
    userId = user.id
  }
  const habilitations = await prisma.habilitation.findMany({
    where: { userId },
    include: { user: { select: { id: true, name: true, username: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ habilitations })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const formData = await req.formData()
    const userId = formData.get('userId')
    const expiresAt = formData.get('expiresAt')
    const title = formData.get('title')
    const file = formData.get('file')

    if (!userId || !expiresAt || !file) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Validate file is PDF
    if (file.type !== 'application/pdf') {
      return new Response('Only PDF files are allowed', { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'habilitations')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `habilitation_${userId}_${timestamp}.pdf`
    const filePath = path.join(uploadsDir, filename)
    const relativePath = `uploads/habilitations/${filename}`

    // Save file
    const buffer = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(buffer))

    // Create habilitation record
    const habilitation = await prisma.habilitation.create({
      data: {
        userId,
        title: title && title.trim() !== '' ? title.trim() : null,
        filePath: relativePath,
        expiresAt: new Date(expiresAt)
      },
      include: { user: { select: { name: true, username: true } } }
    })

    return Response.json({ habilitation })
  } catch (error) {
    console.error('Error creating habilitation:', error)
    return new Response('Server error', { status: 500 })
  }
}
