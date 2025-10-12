import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import nodemailer from 'nodemailer'

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const requestedUserId = searchParams.get('userId')

  // Si un userId spécifique est demandé, l'utiliser, sinon utiliser l'utilisateur connecté
  let targetUserId
  if (requestedUserId) {
    targetUserId = requestedUserId
  } else {
    const user = await prisma.user.findUnique({ where: { username: session.user.username } })
    if (!user) return new Response('User not found', { status: 404 })
    targetUserId = user.id
  }

  const threshold = new Date()
  threshold.setMonth(threshold.getMonth() + 3)

  const habilitations = await prisma.habilitation.findMany({
    where: {
      userId: targetUserId,
      expiresAt: { lte: threshold }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          username: true
        }
      }
    },
    orderBy: {
      expiresAt: 'asc'
    }
  })
  // Envoyer email seulement si c'est pour l'utilisateur connecté et qu'il a des habilitations expirantes
  if (!requestedUserId && habilitations.length > 0) {
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

      if (habilitations[0].user.email) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: habilitations[0].user.email,
          subject: 'Habilitations expirant bientôt',
          text: `Bonjour ${habilitations[0].user.name},\n\nVous avez ${habilitations.length} habilitation(s) qui expire(nt) dans les 3 prochains mois.\n\nVeuillez contacter votre administrateur pour les renouveler.`
        })
      }
    } catch (err) {
      console.error('Error sending email', err)
    }
  }
  return Response.json({ habilitations })
}
