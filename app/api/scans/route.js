import { addScan } from '@/lib/commun-data'

export async function POST(req) {
  let data
  try {
    data = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  const log = addScan({
    hash: data.hash,
    name: data.name,
    scannedBy: data.scannedBy,
    changes: data.changes,
    scannedAt: data.scannedAt || new Date().toISOString()
  })
  return Response.json({ id: log.id }, { status: 201 })
}
