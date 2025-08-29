import { prisma } from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'

export async function DELETE(_req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { id } = params
  // Prevent self-delete just in case
  const me = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (me?.id === id) return new Response('Vous ne pouvez pas vous supprimer.', { status: 400 })
  await prisma.user.delete({ where: { id } })
  return Response.json({ ok: true })
}
