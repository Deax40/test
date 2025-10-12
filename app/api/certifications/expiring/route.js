import { prisma } from '@/lib/prisma'
import { sendExpirationAlert } from '@/lib/email'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const threeMonthsFromNow = new Date()
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

  const expiringCertifications = await prisma.certification.findMany({
    where: {
      revisionDate: {
        lte: threeMonthsFromNow
      }
    },
    include: {
      tool: true
    },
    orderBy: {
      revisionDate: 'asc'
    }
  })

  return Response.json({ expiringCertifications })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  const threeMonthsFromNow = new Date()
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

  const expiringCertifications = await prisma.certification.findMany({
    where: {
      revisionDate: {
        lte: threeMonthsFromNow
      }
    },
    include: {
      tool: true
    }
  })

  let emailsSent = 0

  for (const cert of expiringCertifications) {
    try {
      await sendExpirationAlert({
        toolName: cert.tool.name,
        expirationDate: cert.revisionDate,
        userName: 'Administrateur',
        userEmail: process.env.ADMIN_EMAIL
      })
      emailsSent++
    } catch (error) {
      console.error(`Error sending alert for ${cert.tool.name}:`, error)
    }
  }

  return Response.json({
    message: `${emailsSent} alerts sent for ${expiringCertifications.length} expiring certifications`
  })
}