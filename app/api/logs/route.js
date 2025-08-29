import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: order },
    include: { createdBy: { select: { username: true, name: true } } }
  })
  return Response.json({ logs })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'TECH') {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await req.json()
  const { qrData, lieu, date, actorName } = body
  if (!qrData || !lieu || !date || !actorName) {
    return new Response('Missing fields', { status: 400 })
  }
  const log = await prisma.log.create({
    data: {
      qrData,
      lieu,
      date: new Date(date),
      actorName,
      createdBy: { connect: { username: session.user.username } }
    }
  })
  return Response.json({ ok: true, log })
}
