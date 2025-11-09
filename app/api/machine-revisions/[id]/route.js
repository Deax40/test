import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { name, revisionDate } = await req.json()
    const id = parseInt(params.id)

    if (!name) {
      return new Response('Missing name', { status: 400 })
    }

    const date = revisionDate ? new Date(revisionDate) : null
    if (date && isNaN(date.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }

    const revision = await prisma.machineRevision.update({
      where: { id },
      data: { name, revisionDate: date }
    })

    return Response.json({ revision })
  } catch (e) {
    console.error('Error updating machine revision', e)
    return new Response('Server error', { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const id = parseInt(params.id)

    await prisma.machineRevision.delete({
      where: { id }
    })

    return Response.json({ success: true })
  } catch (e) {
    console.error('Error deleting machine revision', e)
    return new Response('Server error', { status: 500 })
  }
}