import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true }
  })
  return Response.json({ users })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await req.json()
  const { username, name, password, role } = body
  if (!username || !name || !password) {
    return new Response('Missing fields', { status: 400 })
  }
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return new Response('Username already exists', { status: 409 })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, name, passwordHash, role: role === 'ADMIN' ? 'ADMIN' : 'TECH' }
  })
  return Response.json({ user })
}
