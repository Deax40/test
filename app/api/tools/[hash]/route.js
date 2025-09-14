import { getTool, patchTool } from '@/lib/commun-data'

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
  if (!hash) {
    return new Response('Hash required', { status: 422 })
  }
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
  const updated = patchTool(hash, patch)
  if (!updated) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json(updated)
}
