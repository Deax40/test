import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import nodemailer from 'nodemailer'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const user = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!user) return new Response('User not found', { status: 404 })
  const threshold = new Date()
  threshold.setMonth(threshold.getMonth() + 3)
  const habilitations = await prisma.habilitation.findMany({
    where: { userId: user.id, expiresAt: { lte: threshold } }
  })
  if (habilitations.length > 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: 'julien.civi@gmail.com',
        subject: 'Habilitation expirant bientôt',
        text: `L'utilisateur ${user.name} (${user.username}) a des habilitations expirant bientôt.`
      })
    } catch (err) {
      console.error('Error sending email', err)
    }
  }
  return Response.json({ habilitations })
}
