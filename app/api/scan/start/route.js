import { startScan } from '@/lib/unified-scan'

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
    // Check for CARE_ prefix
    if (candidate.startsWith('CARE_')) {
      hash = candidate
    } else if (/^[a-fA-F0-9]{64}$/.test(candidate)) {
      hash = candidate.toLowerCase()
    } else if (/^[a-fA-F0-9]{8}$/.test(candidate.toUpperCase())) {
      // Care tool hash format
      hash = candidate.toUpperCase()
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
  const result = await startScan({ hash, name, scannedBy })
  if (!result) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json({
    editSessionToken: result.token,
    tool: result.tool,
    source: result.source
  })
}
