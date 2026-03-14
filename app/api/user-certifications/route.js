import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const managerId = searchParams.get('managerId')
  const teamTag = searchParams.get('teamTag')

  let where = {}

  if (userId) {
    where.userId = userId
  } else if (managerId) {
    where.managerId = managerId
  } else if (teamTag) {
    where.user = { teamTag }
  }

  const certifications = await prisma.userCertification.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, username: true } },
      manager: { select: { id: true, name: true, username: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return Response.json({ certifications })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const formData = await req.formData()
    const userId = formData.get('userId')
    const title = formData.get('title')
    const revisionDateStr = formData.get('revisionDate')
    const toolId = formData.get('toolId')
    const toolName = formData.get('toolName')
    const toolCategory = formData.get('toolCategory')
    const pdfFile = formData.get('pdfFile')
    const notes = formData.get('notes')

    if (!userId || !title || !revisionDateStr) {
      return new Response('Missing required fields', { status: 400 })
    }

    const revisionDate = new Date(revisionDateStr)
    if (isNaN(revisionDate.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) return new Response('User not found', { status: 404 })

    const manager = await prisma.user.findUnique({ where: { username: session.user.username } })

    const certData = {
      userId,
      userName: targetUser.name,
      managerId: manager?.id || null,
      managerName: manager?.name || null,
      title,
      revisionDate,
      toolId: toolId || null,
      toolName: toolName || null,
      toolCategory: toolCategory || null,
      notes: notes || null
    }

    if (pdfFile && pdfFile.size > 0) {
      if (pdfFile.type !== 'application/pdf') {
        return new Response('Only PDF files are allowed', { status: 400 })
      }
      if (pdfFile.size > 4 * 1024 * 1024) {
        return new Response('PDF trop volumineux (max 4MB)', { status: 400 })
      }
      const bytes = await pdfFile.arrayBuffer()
      certData.pdfBuffer = Buffer.from(bytes)
      certData.pdfType = pdfFile.type
    }

    const certification = await prisma.userCertification.create({ data: certData })
    return Response.json({ certification })
  } catch (e) {
    console.error('[USER-CERT] Error creating certification:', e)
    return new Response('Server error', { status: 500 })
  }
}
