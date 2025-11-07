import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const toolHash = searchParams.get('toolHash')

    if (!toolHash) {
      return NextResponse.json({ error: 'toolHash est requis' }, { status: 400 })
    }

    // Récupérer l'historique des 12 derniers mois
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const history = await prisma.scanHistory.findMany({
      where: {
        toolHash: toolHash,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ history, count: history.length })
  } catch (error) {
    console.error('Error fetching scan history:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
