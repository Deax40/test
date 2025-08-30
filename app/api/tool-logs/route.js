import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const logs = await prisma.toolLog.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      tool: true,
      status: true,
      lieu: true,
      client: true,
      etat: true,
      transporteur: true,
      tracking: true,
      createdAt: true,
      createdBy: { select: { username: true, name: true } }
    }
  })
  return Response.json({ logs })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'TECH') {
    return new Response('Unauthorized', { status: 401 })
  }
  const form = await req.formData()
  const tool = form.get('tool')
  const status = form.get('status')
  const lieu = form.get('lieu') || null
  const client = form.get('client') || null
  const etat = form.get('etat') || null
  const transporteur = form.get('transporteur') || null
  const tracking = form.get('tracking') || null
  if (!tool || !status) {
    return new Response('Missing fields', { status: 400 })
  }
  const log = await prisma.toolLog.create({
    data: {
      tool,
      status,
      lieu,
      client,
      etat,
      transporteur,
      tracking,
      createdBy: { connect: { username: session.user.username } }
    }
  })
  return Response.json({ ok: true, log })
}
