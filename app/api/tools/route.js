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

const STATIC_CARE_TOOLS = [
  'Care Capteur pression matière Silicone 43CH002505',
  'Jeu 1 Care Control Chauffe Paris',
  'Jeu 1 Care Extension de Colonne Paris',
  'Jeu 1 Care Four flucke Paris',
  'Jeu 1 Care Mesure de Pression Paris',
  'Jeu 2 Care Chauffe Paris',
  'Jeu 2 Care Mesure de Pression Paris',
  'Jeu 2 Care Pression matière Paris',
  'Jeu 3 Care Chauffe Gleizé',
  'Jeu 3 Care Extension de Colonne Gleizé',
  'Jeu 3 Care Four flucke Gleizé',
  'Jeu 3 Care Pression matière Gleizé',
  'Jeu 4 Care Chauffe Gleizé',
  'Jeu 4 Care Extension de Colonne Gleizé',
  'Jeu 4 Care Pression matière Gleizé'
].map((name, i) => ({ id: `static-care-${i}`, name, category: 'CARE' }))

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const normalizedCategory = category?.toUpperCase()
  let tools = await prisma.tool.findMany({
    where: normalizedCategory
      ? { category: { equals: normalizedCategory, mode: 'insensitive' } }
      : {},
    orderBy: { name: 'asc' }
  })
  if (normalizedCategory === 'COMMUN') {
    tools = [...tools, ...STATIC_COMMUN_TOOLS]
      .sort((a, b) => a.name.localeCompare(b.name))
  }
  if (normalizedCategory === 'CARE') {
    tools = [...tools, ...STATIC_CARE_TOOLS]
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
