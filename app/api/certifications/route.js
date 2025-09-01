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
    const formData = await req.formData()
    const toolId = formData.get('toolId')
    const months = parseInt(formData.get('months'))
    const file = formData.get('file')
    if (!toolId || !months || !file) {
      return new Response('Missing fields', { status: 400 })
    }
    const tool = await prisma.tool.findUnique({ where: { id: toolId } })
    if (!tool) {
      return new Response('Invalid tool', { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileType = file.type || 'application/octet-stream'
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)
    const certification = await prisma.certification.create({
      data: { toolId, file: buffer, fileType, expiresAt }
    })
    return Response.json({ certification })
  } catch (e) {
    console.error('Error creating certification', e)
    return new Response('Server error', { status: 500 })
  }
}
