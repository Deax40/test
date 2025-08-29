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

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await req.json()
  let { username, name, email, password, role } = body

  username = username?.trim()
  name = name?.trim()
  email = email?.trim()?.toLowerCase()
  role = role === 'ADMIN' ? 'ADMIN' : 'TECH'

  if (!username || !name || !email || !password) {
    return new Response('Missing fields', { status: 400 })
  }
  if (password.length < 8) {
    return new Response('Password too short', { status: 400 })
  }
  const byUsername = await prisma.user.findUnique({ where: { username } })
  if (byUsername) return new Response('Username already exists', { status: 409 })

  const byEmail = await prisma.user.findUnique({ where: { email } })
  if (byEmail) return new Response('Email already exists', { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, name, email, passwordHash, role },
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
  })
  return Response.json({ user })
}

