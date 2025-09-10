import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { password } = await req.json()
  if (!password) {
    return new Response('Missing password', { status: 400 })
  }
  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { username: session.user.username },
    data: { passwordHash: hash }
  })
  return Response.json({ ok: true })
}
