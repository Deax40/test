import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const certifications = await prisma.certification.findMany({
    include: { tool: true },
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
    const { toolId, revisionDate: revisionDateStr } = await req.json()
    if (!toolId || !revisionDateStr) {
      return new Response('Missing fields', { status: 400 })
    }
    const tool = await prisma.tool.findUnique({ where: { id: toolId } })
    if (!tool) {
      return new Response('Invalid tool', { status: 400 })
    }
    const revisionDate = new Date(revisionDateStr)
    if (isNaN(revisionDate.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }
    const certification = await prisma.certification.create({
      data: { toolId, revisionDate }
    })
    return Response.json({ certification })
  } catch (e) {
    console.error('Error creating certification', e)
    return new Response('Server error', { status: 500 })
  }
}
