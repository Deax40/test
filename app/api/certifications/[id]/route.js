import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { revisionDate } = await req.json()

    if (!revisionDate) {
      return new Response('Missing revision date', { status: 400 })
    }

    const parsedDate = new Date(revisionDate)
    if (isNaN(parsedDate.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }

    const certification = await prisma.certification.update({
      where: { id: params.id },
      data: { revisionDate: parsedDate },
      include: { tool: true }
    })

    return Response.json({ certification })
  } catch (error) {
    console.error('Error updating certification:', error)
    return new Response('Server error', { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  await prisma.certification.delete({ where: { id: params.id } })
  return Response.json({ ok: true })
}
