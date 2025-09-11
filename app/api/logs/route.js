import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import nodemailer from 'nodemailer'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const format = searchParams.get('format')
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: order },
    select: {
      id: true,
      qrData: true,
      lieu: true,
      date: true,
      actorName: true,
      etat: true,
      probleme: true,
      photoType: true,
      createdBy: { select: { username: true, name: true } }
    }
  })
  if (format === 'csv') {
    const header = 'Date,QR,Lieu,Technicien,Etat,Probleme\n'
    const body = logs.map(l => [
      new Date(l.date).toLocaleString('fr-FR'),
      l.qrData,
      l.lieu,
      l.actorName,
      l.etat,
      l.probleme || ''
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const csv = header + body
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="logs.csv"'
      }
    })
  }
  if (format === 'txt') {
    const txt = logs
      .map(l => `${new Date(l.date).toLocaleString('fr-FR')} | ${l.qrData} | ${l.lieu} | ${l.actorName} | ${l.etat} | ${l.probleme || ''}`)
      .join('\n')
    return new Response(txt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="logs.txt"'
      }
    })
  }
  return Response.json({ logs })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || !['TECH', 'ADMIN'].includes(session.user?.role)) {
    return new Response('Unauthorized', { status: 401 })
  }
  const form = await req.formData()
  const qrData = form.get('qrData')
  const lieu = form.get('lieu')
  const date = form.get('date')
  const actorName = form.get('actorName')
  const etat = form.get('etat')
  const probleme = form.get('probleme')
  const photo = form.get('photo')
  if (!qrData || !lieu || !date || !actorName || !etat) {
    return new Response('Missing fields', { status: 400 })
  }
  const tool = await prisma.tool.findFirst({
    where: {
      OR: [
        { qrData },
        { name: { equals: qrData, mode: 'insensitive' } }
      ]
    }
  })
  if (!tool) {
    return new Response('QR code inconnu', { status: 400 })
  }
  let photoBuffer = null
  let photoType = null
  if (etat === 'PROBLEME') {
    if (!photo || typeof photo.arrayBuffer !== 'function') {
      return new Response('Photo required', { status: 400 })
    }
    if (!probleme) {
      return new Response('Problem description required', { status: 400 })
    }
    photoBuffer = Buffer.from(await photo.arrayBuffer())
    photoType = photo.type || 'image/jpeg'
  }
  const log = await prisma.log.create({
    data: {
      qrData,
      lieu,
      date: new Date(date),
      actorName,
      etat,
      probleme,
      photo: photoBuffer,
      photoType,
      createdBy: { connect: { username: session.user.username } }
    }
  })
  await prisma.tool.update({
    where: { id: tool.id },
    data: {
      lastScanAt: new Date(date),
      lastScanUser: actorName,
      lastScanLieu: lieu,
      lastScanEtat: etat
    }
  })
  const count = await prisma.log.count()
  if (count >= 7) {
    await prisma.log.deleteMany({})
  }
  if (etat === 'PROBLEME') {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', NOT: { email: null } },
        select: { email: true, name: true }
      })
      if (photoBuffer) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
        const to = [...admins.map(a => a.email), 'julien.civi@gmail.com'].join(',')
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject: 'Problème signalé',
          text: `Un problème a été signalé par ${actorName} (${session.user.username}).\nDescription: ${probleme}\nQR: ${qrData}\nLieu: ${lieu}\nDate: ${new Date(date).toLocaleString('fr-FR')}`,
          attachments: [
            { filename: `photo.${photoType?.split('/')[1] || 'jpg'}`, content: photoBuffer, contentType: photoType || 'image/jpeg' }
          ]
        })
      }
    } catch (err) {
      console.error('Error sending email', err)
    }
  }
  return Response.json({ ok: true, log })
}
