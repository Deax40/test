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
  if (typeof data.contact === 'string') patch.contact = data.contact.trim()
  if (typeof data.weight === 'string') patch.weight = data.weight.trim()
  if (typeof data.date === 'string') patch.date = data.date.trim()
  if (typeof data.lastUser === 'string') patch.lastUser = data.lastUser.trim()
  if (typeof data.dimensions === 'string') patch.dimensions = data.dimensions.trim()
  if (typeof data.user === 'string' && !patch.lastUser) patch.lastUser = data.user.trim()
  const updated = patchTool(hash, patch, userId || '')
  if (!updated) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  // Log the update to help verify persistence on the server side
  console.log('Tool updated', { hash, patch, userId })
  const response = { tool: updated }
  if (userId) {
    response.editSessionToken = createToken(hash, userId)
  }
  return Response.json(response)
}
