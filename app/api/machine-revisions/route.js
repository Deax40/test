import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const revisions = await prisma.machineRevision.findMany({
    orderBy: { name: 'asc' }
  })
  return Response.json({ revisions })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  try {
    const { name, revisionDate } = await req.json()
    if (!name) {
      return new Response('Missing name', { status: 400 })
    }
    const date = revisionDate ? new Date(revisionDate) : null
    if (date && isNaN(date.getTime())) {
      return new Response('Invalid revision date', { status: 400 })
    }
    const revision = await prisma.machineRevision.upsert({
      where: { name },
      update: { revisionDate: date },
      create: { name, revisionDate: date }
    })
    return Response.json({ revision })
  } catch (e) {
    console.error('Error saving machine revision', e)
    return new Response('Server error', { status: 500 })
  }
}
