import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const userIdParam = searchParams.get('userId')
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
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ habilitations })
}
