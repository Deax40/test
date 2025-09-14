import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTool, patchTool } from '@/lib/commun-data'

export async function GET(req, { params }) {
  const { id } = params
  const tool = getTool(id)
  if (!tool) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const { id } = params
  let data
  try {
    data = await req.json()
  } catch {
    data = {}
  }
  const allowed = ['site', 'status', 'holder', 'notes']
  const patch = {}
  for (const k of allowed) {
    if (k in data) patch[k] = data[k]
  }
  if (data.extra) patch.extra = data.extra
  const updated = patchTool(id, patch)
  if (!updated) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json(updated)
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const { id } = params
  await prisma.tool.delete({ where: { id } })
  return Response.json({ ok: true })
}
