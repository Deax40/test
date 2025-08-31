import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tools = await prisma.tool.findMany({
    where: category ? { category } : {},
    orderBy: { name: 'asc' }
  })
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
