import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const admin = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: { id: true, name: true, teamTag: true }
    })

    if (!admin) return new Response('Admin not found', { status: 404 })

    const teamTag = admin.teamTag

    if (!teamTag) {
      return Response.json({ teamTag: null, members: [] })
    }

    const members = await prisma.user.findMany({
      where: { role: 'TECH', teamTag },
      select: {
        id: true,
        name: true,
        username: true,
        teamTag: true,
        userCertifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return Response.json({ teamTag, members })
  } catch (e) {
    console.error('[MON-EQUIPE] Error:', e)
    return new Response('Server error', { status: 500 })
  }
}
