import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { startScan } from '@/lib/commun-data'
import { authOptions } from '@/lib/auth'

const PayloadSchema = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/i, 'hash invalide'),
  scannedBy: z.string().trim().max(191).optional(),
})

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const role = session.user?.role
  if (role !== 'TECH' && role !== 'ADMIN') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 })
  }

  const payload = PayloadSchema.safeParse(body)
  if (!payload.success) {
    return Response.json(
      { error: 'bad_request', details: payload.error.flatten() },
      { status: 400 }
    )
  }

  const username = session.user?.username || session.user?.email || session.user?.name || 'user'
  const displayName = payload.data.scannedBy?.trim() || session.user?.name || session.user?.username || ''
  const result = await startScan({
    hash: payload.data.hash.toLowerCase(),
    scannedBy: displayName,
    tokenOwner: {
      id: username,
      displayName: displayName || username,
    },
  })
  if (!result) {
    return Response.json({ error: 'tool_not_found' }, { status: 404 })
  }
  return Response.json({ editSessionToken: result.token, tool: result.tool })
}
