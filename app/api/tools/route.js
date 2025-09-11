import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const qr = searchParams.get('qr')
  if (qr) {
    const tool = await prisma.tool.findUnique({ where: { qrData: qr } })
    if (!tool) {
      return new Response('Not found', { status: 404 })
    }
    return Response.json({ tool })
  }

  const name = searchParams.get('name')
  if (name) {
    const tool = await prisma.tool.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (!tool) {
      return new Response('Not found', { status: 404 })
    }
    return Response.json({ tool })
  }

  const category = searchParams.get('category')
  const normalizedCategory = category?.toUpperCase()

  const tools = await prisma.tool.findMany({
    where: normalizedCategory
      ? { category: { equals: normalizedCategory, mode: 'insensitive' } }
      : {},
    orderBy: { name: 'asc' }
  })

  return Response.json({ tools })
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { name, category, qrData } = await req.json()
  if (!name || !category || !qrData) {
    return new Response('Missing fields', { status: 400 })
  }
  const tool = await prisma.tool.create({ data: { name, category, qrData } })
  return Response.json({ tool })
}
