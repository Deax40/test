import { getServerSession } from 'next-auth'
import { listTools } from '@/lib/commun-data'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  const role = session.user?.role
  if (role !== 'TECH' && role !== 'ADMIN') {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }
  const tools = await listTools()
  return Response.json({ tools })
}
