import { getTool, patchTool, consumeToken, createToken } from '@/lib/commun-data'

export async function GET(req, { params }) {
  const hash = String(params.hash || '').trim().toLowerCase()
  const tool = getTool(hash)
  if (!tool) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json(tool)
}

export async function PATCH(req, { params }) {
  const hash = String(params.hash || '').trim().toLowerCase()
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  let userId = null
  if (token) {
    userId = consumeToken(token, hash)
    if (!userId) {
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
  const patch = {}
  if (typeof data.name === 'string') patch.name = data.name.trim()
  if (typeof data.location === 'string') patch.location = data.location.trim()
  if (typeof data.state === 'string') patch.state = data.state.trim()
  if (typeof data.weight === 'string') patch.weight = data.weight.trim()
  if (typeof data.imoNumber === 'string') patch.imoNumber = data.imoNumber.trim()
  if (typeof data.user === 'string') patch.lastScanBy = data.user.trim()
  if (typeof data.lastScanBy === 'string') patch.lastScanBy = data.lastScanBy.trim()
  const updated = patchTool(hash, patch, userId || '')
  if (!updated) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  const response = { tool: updated }
  if (userId) {
    response.editSessionToken = createToken(hash, userId)
  }
  return Response.json(response)
}
