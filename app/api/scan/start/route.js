import { startScan } from '@/lib/commun-data'

export async function POST(req) {
  const contentType = req.headers.get('content-type') || ''
  let hash, name, scannedBy = '', raw = ''
  if (contentType.includes('application/json')) {
    try {
      const body = await req.json()
      hash = body.hash
      name = body.name
      scannedBy = body.scannedBy || ''
    } catch {
      return Response.json(
        { error: 'bad_request', hint: 'expecting hash|name|raw' },
        { status: 400 }
      )
    }
  } else {
    raw = await req.text()
  }
  if (!hash && !name && raw) {
    const candidate = raw.trim()
    if (/^[a-fA-F0-9]{64}$/.test(candidate)) {
      hash = candidate.toLowerCase()
    } else {
      name = candidate
    }
  }
  if (!hash && !name) {
    return Response.json(
      { error: 'bad_request', hint: 'expecting hash|name|raw' },
      { status: 400 }
    )
  }
  const result = startScan({ hash, name, scannedBy })
  if (!result) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json({ editSessionToken: result.token, tool: result.tool })
}
