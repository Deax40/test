import { startScan } from '@/lib/commun-data'

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const { hash, scannedBy } = body
  if (!hash?.trim() || !scannedBy?.trim()) {
    return new Response('Missing fields', { status: 422 })
  }
  console.log('Received scan hash:', hash)
  const result = startScan(hash, scannedBy)
  if (!result) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json({ editSessionToken: result.token, tool: result.tool })
}
