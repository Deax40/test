import { prisma } from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import bcrypt from 'bcryptjs'

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

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { id } = params
  const body = await req.json()
  let { username, name, email, password, role } = body
  username = username?.trim()
  name = name?.trim()
  email = email?.trim()?.toLowerCase()
  role = role === 'ADMIN' ? 'ADMIN' : 'TECH'
  const data = { username, name, email, role }
  if (password) {
    if (password.length < 8) {
      return new Response('Password too short', { status: 400 })
    }
    data.passwordHash = await bcrypt.hash(password, 10)
  }
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, email: true, role: true }
    })
    return Response.json({ user })
  } catch (err) {
    return new Response('Update failed', { status: 400 })
  }
}
