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
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
  })
  return Response.json({ users })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await request.json()
  const { username, name, email, password, role } = body
  if (!username || !name || !email || !password) {
    return new Response('Missing fields', { status: 400 })
  }
  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) return new Response('Username already exists', { status: 409 })
  const emailExists = await prisma.user.findUnique({ where: { email } })
  if (emailExists) return new Response('Email already exists', { status: 409 })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, name, email, passwordHash, role: role === 'ADMIN' ? 'ADMIN' : 'TECH' }
  })
  return Response.json({ user })
}
