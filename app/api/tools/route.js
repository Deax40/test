import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const qr = searchParams.get('qr')
    if (qr) {
      let tool = await prisma.tool.findUnique({ where: { qrData: qr } })

      if (!tool && qr.toLowerCase().includes("camera d'inspection gleize")) {
        tool = await prisma.tool.findFirst({
          where: {
            OR: [
              { qrData: { contains: "Camera d'inspection Gleize" } },
              { name: { contains: "Camera d'inspection Gleize" } }
            ]
          }
        })
      }

      if (!tool) {
        return new Response('Not found', { status: 404 })
      }
      return Response.json({ tool })
    }

    const name = searchParams.get('name')
    if (name) {
      const tool = await prisma.tool.findFirst({
        where: { name: { equals: name } }
      })
      if (!tool) {
        return new Response('Not found', { status: 404 })
      }
      return Response.json({ tool })
    }

    const category = searchParams.get('category')
    const normalizedCategory = category?.toUpperCase()

    // Essayer d'abord d'inclure les certifications, sinon récupérer sans
    let tools;
    try {
      tools = await prisma.tool.findMany({
        where: normalizedCategory
          ? { category: { equals: normalizedCategory } }
          : {},
        include: {
          certifications: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (certError) {
      console.warn('Certifications table may not exist yet, fetching tools without certifications:', certError.message);
      // Si l'inclusion des certifications échoue, récupérer juste les outils
      tools = await prisma.tool.findMany({
        where: normalizedCategory
          ? { category: { equals: normalizedCategory } }
          : {},
        orderBy: { name: 'asc' }
      });
      // Ajouter un tableau vide de certifications pour la compatibilité
      tools = tools.map(tool => ({ ...tool, certifications: [] }));
    }

    return Response.json({ tools })
  } catch (error) {
    console.error('Error in GET /api/tools:', error)
    return new Response(`Server error: ${error.message}`, { status: 500 })
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { name, category, hash, qrData } = await req.json()
  if (!name || !category || !hash) {
    return new Response('Missing fields', { status: 400 })
  }
  const tool = await prisma.tool.create({ data: { name, category, hash, qrData: qrData || hash } })
  return Response.json({ tool })
}

export async function PATCH() {
  return new Response('Hash required', { status: 422 })
}
