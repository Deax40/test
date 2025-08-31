import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')
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
  if (format === 'csv') {
    const header = 'Date,Outil,Status,Client,Lieu,Transporteur,Tracking,Technicien\n'
    const body = logs.map(l => [
      new Date(l.createdAt).toLocaleString('fr-FR'),
      l.tool,
      l.status,
      l.client || '',
      l.lieu || '',
      l.transporteur || '',
      l.tracking || '',
      l.createdBy?.name || ''
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const csv = header + body
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tool-logs.csv"'
      }
    })
  }
  if (format === 'txt') {
    const txt = logs
      .map(l => `${new Date(l.createdAt).toLocaleString('fr-FR')} | ${l.tool} | ${l.status} | ${l.client || ''} | ${l.lieu || ''} | ${l.transporteur || ''} | ${l.tracking || ''} | ${l.createdBy?.name || ''}`)
      .join('\n')
    return new Response(txt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tool-logs.txt"'
      }
    })
  }
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
  const count = await prisma.toolLog.count()
  if (count >= 10) {
    await prisma.toolLog.deleteMany({})
  }
  return Response.json({ ok: true, log })
}
