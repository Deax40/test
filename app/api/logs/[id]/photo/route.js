import { prisma } from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'

export async function GET(_req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const log = await prisma.log.findUnique({ where: { id: params.id }, select: { photo: true, photoType: true } })
  if (!log || !log.photo) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(log.photo, { headers: { 'Content-Type': log.photoType || 'image/jpeg' } })
}
