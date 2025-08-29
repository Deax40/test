import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
 codex/add-technician-status-section-and-update-admin-page-mp44d9
  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
  })
  return Response.json({ users })
}

export async function POST(request) {


  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
  })

  return Response.json({ users })
}

export async function POST(req: Request) {
 main
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
codex/add-technician-status-section-and-update-admin-page-mp44d9
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


  const body = await req.json()
  let { username, name, email, password, role } = body as {
    username?: string; name?: string; email?: string; password?: string; role?: 'ADMIN' | 'TECH'
  }

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

  // Unicité
  const byUsername = await prisma.user.findUnique({ where: { username } })
  if (byUsername) return new Response('Username already exists', { status: 409 })

  const byEmail = await prisma.user.findUnique({ where: { email } })
  if (byEmail) return new Response('Email already exists', { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { username, name, email, passwordHash, role },
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
  })

 main
  return Response.json({ user })
}
