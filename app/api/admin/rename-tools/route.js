import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET : liste les outils dont le nom ressemble à "Tool HASH" ou "Outil sans nom"
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const tools = await prisma.tool.findMany({
    where: {
      OR: [
        { name: { startsWith: 'Tool ' } },
        { name: 'Outil sans nom' },
        { name: { equals: '' } }
      ]
    },
    select: {
      id: true,
      hash: true,
      name: true,
      category: true,
      lastScanAt: true,
      lastScanLieu: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ tools })
}

// PATCH : renomme un outil par son id
export async function PATCH(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const { id, name } = await req.json()
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'id et name requis' }, { status: 400 })
    }

    // Vérifier doublon (insensible à la casse)
    const duplicate = await prisma.tool.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id } }
    })
    if (duplicate) {
      return NextResponse.json({ error: `Un outil nommé "${duplicate.name}" existe déjà` }, { status: 409 })
    }

    const updated = await prisma.tool.update({
      where: { id },
      data: { name: name.trim() },
      select: { id: true, hash: true, name: true, category: true }
    })

    return NextResponse.json({ tool: updated })
  } catch (e) {
    console.error('[RENAME-TOOLS]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
