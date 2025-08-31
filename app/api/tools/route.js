import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const STATIC_COMMUN_TOOLS = [
  'Pompe Enerpac',
  'Rallonge micromètre intérieur contrôle fourreau',
  'Règle de niveau jeu 1 Gleizé',
  'Règle de niveau jeu 2 Gleizé',
  'Verin 30 cm Gleizé',
  'Visseuse electrique a choc Gleizé',
  'Visseuse pneumatique Gleizé',
  'Visseuse pneumatique Paris',
  'clef serre tube Gleizé',
  'clé dynamométrique Gleizé',
  'clé plate diam 70 Gleizé',
  'comparateur interieur pour contrôle fourreau',
  'douilles visseuse Gleizé',
  'jeux demontage vis a billes Gleizé',
  'jeux demontage vis a billes Gleizé',
  'kit changement codeur Baummeuler Gleizé',
  'pince a sertir Europam 67 Gleizé',
  'pince a sertir cosses 10-35',
  'testeur isolement Iso-tech Gleizé'
].map((name, i) => ({ id: `static-${i}`, name, category: 'COMMUN' }))

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  let tools = await prisma.tool.findMany({
    where: category ? { category } : {},
    orderBy: { name: 'asc' }
  })
  if (category === 'COMMUN') {
    tools = [...tools, ...STATIC_COMMUN_TOOLS]
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  return Response.json({ tools })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { name, category } = await req.json()
  if (!name || !category) {
    return new Response('Missing fields', { status: 400 })
  }
  const tool = await prisma.tool.create({ data: { name, category } })
  return Response.json({ tool })
}
