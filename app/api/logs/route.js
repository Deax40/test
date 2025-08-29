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
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: order },
    select: {
      id: true,
      qrData: true,
      lieu: true,
      date: true,
      actorName: true,
      etat: true,
      photoType: true,
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
  const qrData = form.get('qrData')
  const lieu = form.get('lieu')
  const date = form.get('date')
  const actorName = form.get('actorName')
  const etat = form.get('etat')
  const photo = form.get('photo')
  if (!qrData || !lieu || !date || !actorName || !etat) {
    return new Response('Missing fields', { status: 400 })
  }
  let photoBuffer = null
  let photoType = null
  if (etat === 'ENDOMMAGE') {
    if (!photo || typeof photo.arrayBuffer !== 'function') {
      return new Response('Photo required', { status: 400 })
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
      photo: photoBuffer,
      photoType,
      createdBy: { connect: { username: session.user.username } }
    }
  })
  if (etat === 'ENDOMMAGE') {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', NOT: { email: null } },
        select: { email: true, name: true }
      })
      if (admins.length > 0 && photoBuffer) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
        const to = admins.map(a => a.email).join(',')
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject: 'Équipement endommagé signalé',
          text: `Un équipement a été scanné en état endommagé par ${actorName} (${session.user.username}).\nQR: ${qrData}\nLieu: ${lieu}\nDate: ${new Date(date).toLocaleString('fr-FR')}`,
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
