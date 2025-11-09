import { prisma } from '@/lib/prisma'
import { sendHabilitationExpirationAlert } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    // Calculer la date dans 30 jours
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // Récupérer toutes les habilitations qui expirent dans les 30 prochains jours
    const expiringHabilitations = await prisma.habilitation.findMany({
      where: {
        expiresAt: {
          lte: thirtyDaysFromNow,
          gte: new Date() // Pas encore expirées
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`Found ${expiringHabilitations.length} expiring habilitation(s)`)

    let sentCount = 0
    let skippedCount = 0

    // Envoyer un email pour chaque habilitation qui expire
    for (const hab of expiringHabilitations) {
      if (hab.user.email) {
        try {
          await sendHabilitationExpirationAlert({
            userName: hab.user.name,
            userEmail: hab.user.email,
            habilitationTitle: hab.title,
            expirationDate: hab.expiresAt
          })
          sentCount++
        } catch (error) {
          console.error(`Failed to send email for habilitation ${hab.id}:`, error)
        }
      } else {
        console.log(`User ${hab.user.name} has no email, skipping habilitation ${hab.id}`)
        skippedCount++
      }
    }

    return Response.json({
      success: true,
      message: `Checked ${expiringHabilitations.length} expiring habilitation(s)`,
      sentCount,
      skippedCount
    })
  } catch (error) {
    console.error('Error checking expirations:', error)
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
