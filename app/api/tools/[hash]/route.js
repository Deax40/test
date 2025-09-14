import { getTool, patchTool, consumeToken, createToken } from '@/lib/commun-data'

export async function GET(req, { params }) {
  const { hash } = params
  const tool = getTool(hash)
  if (!tool) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const { hash } = params
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return new Response('Forbidden', { status: 403 })
  }
  const userId = consumeToken(token, hash)
  if (!userId) {
    return new Response('Forbidden', { status: 403 })
  }
  let data
  try {
    data = await req.json()
  } catch {
    data = {}
  }
  const allowed = ['name', 'location', 'state', 'user', 'weight', 'imoNumber']
  for (const k of Object.keys(data)) {
    if (!allowed.includes(k)) {
      return new Response('Invalid field', { status: 422 })
    }
    if (typeof data[k] === 'string') {
      data[k] = data[k].trim()
    }
  }
  const patch = {}
  if (data.name !== undefined) patch.name = data.name
  if (data.location !== undefined) patch.location = data.location
  if (data.state !== undefined) patch.state = data.state
  if (data.weight !== undefined) patch.weight = data.weight
  if (data.imoNumber !== undefined) patch.imoNumber = data.imoNumber
  if (data.user !== undefined) patch.lastScanBy = data.user
  const updated = patchTool(hash, patch, userId)
  if (!updated) {
    return new Response('Not found', { status: 404 })
  }
  const newToken = createToken(hash, userId)
  return Response.json({ tool: updated, editSessionToken: newToken })
}
