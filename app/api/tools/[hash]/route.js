import { getTool, patchTool, consumeToken, createToken } from '@/lib/commun-data'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(191).optional(),
  contact: z.string().trim().max(191).optional(),
  weight: z.string().trim().max(64).optional(),
  date: z.string().trim().max(128).optional(),
  lastUser: z.string().trim().max(191).optional(),
  dimensions: z.string().trim().max(512).optional(),
}).strict()

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const role = session.user?.role
  if (role !== 'TECH' && role !== 'ADMIN') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  const hash = String(params.hash || '').trim().toLowerCase()
  const tool = await getTool(hash)
  if (!tool) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const role = session.user?.role
  if (role !== 'TECH' && role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }
  const hash = String(params.hash || '').trim().toLowerCase()
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  let actor = null
  if (token) {
    actor = consumeToken(token, hash)
    if (!actor) {
      return new Response('Forbidden', { status: 403 })
    }
  }
  let data
  try {
    data = await req.json()
  } catch {
    data = {}
  }
  if (typeof data !== 'object' || data === null) {
    data = {}
  }
  if (typeof data.user === 'string') {
    if (!data.lastUser) {
      data.lastUser = data.user
    }
    delete data.user
  }
  const patchResult = PatchSchema.safeParse(data)
  if (!patchResult.success) {
    return Response.json(
      { error: 'bad_request', details: patchResult.error.flatten() },
      { status: 400 }
    )
  }
  const fallbackActor = {
    id: session.user?.username || session.user?.email || '',
    displayName: session.user?.name || session.user?.username || '',
  }
  const updated = await patchTool(hash, patchResult.data, actor || fallbackActor)
  if (!updated) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  // Log the update to help verify persistence on the server side
  console.log('Tool updated', { hash, patch: patchResult.data, actor: actor || fallbackActor })
  const response = { tool: updated }
  if (actor) {
    response.editSessionToken = createToken(hash, actor)
  }
  return Response.json(response)
}
