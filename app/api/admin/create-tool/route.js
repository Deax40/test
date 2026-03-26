import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await prisma.user.findUnique({ where: { username: session.user.username } })
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  try {
    const { name, category, siteTag, complementaryInfo, weight, imoNumber } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }

    const normalizedCategory = category === 'COMMUN' ? 'COMMUN' : 'CARE'

    // Vérifier doublon de nom (insensible à la casse)
    const duplicate = await prisma.tool.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })
    if (duplicate) {
      return NextResponse.json(
        { error: `Un outil nommé "${duplicate.name}" existe déjà` },
        { status: 409 }
      )
    }

    // Générer un hash unique (8 hex chars) — random pour éviter toute collision
    let hash
    let attempts = 0
    do {
      const raw = crypto.randomBytes(4).toString('hex')
      hash = normalizedCategory === 'CARE' ? raw.toUpperCase() : raw.toLowerCase()
      const existing = await prisma.tool.findUnique({ where: { hash } })
      if (!existing) break
      attempts++
    } while (attempts < 10)

    const qrData = `${normalizedCategory}_${hash}`

    const tool = await prisma.tool.create({
      data: {
        name: name.trim(),
        category: normalizedCategory,
        hash,
        qrData,
        lastScanEtat: 'RAS',
        siteTag: siteTag?.trim() || null,
        complementaryInfo: complementaryInfo?.trim() || null,
        weight: weight?.trim() || null,
        imoNumber: imoNumber?.trim() || null,
      }
    })

    return NextResponse.json({ tool })
  } catch (e) {
    console.error('[CREATE-TOOL]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
