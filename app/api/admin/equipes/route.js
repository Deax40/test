import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'TECH'] } },
    select: { id: true, name: true, username: true, role: true, teamTag: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }]
  })

  return NextResponse.json({ users })
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const { userId, teamTag } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { teamTag: teamTag || null },
      select: { id: true, name: true, username: true, role: true, teamTag: true }
    })

    return NextResponse.json({ user: updated })
  } catch (e) {
    console.error('[ADMIN EQUIPES] Error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
