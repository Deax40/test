import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const toolHash = searchParams.get('toolHash')
    const userName = searchParams.get('userName')
    const lieu = searchParams.get('lieu')
    const etat = searchParams.get('etat')

    // Build where clause
    const where = {}
    if (toolHash) where.toolHash = toolHash
    if (userName) where.scanUser = { contains: userName, mode: 'insensitive' }
    if (lieu) where.scanLieu = { contains: lieu, mode: 'insensitive' }
    if (etat) where.scanEtat = etat

    // Get scan history with tool names
    const scanHistory = await prisma.scanHistory.findMany({
      where,
      include: {
        tool: {
          select: {
            name: true,
            category: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count
    const totalCount = await prisma.scanHistory.count({ where })

    return NextResponse.json({
      history: scanHistory,
      total: totalCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching scan history:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
