import { getAllFileInfo, getFileStats } from '@/lib/admin-file-info'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const includeStats = searchParams.get('stats') === 'true'

  const files = getAllFileInfo()
  const response = { files }

  if (includeStats) {
    response.stats = getFileStats()
  }

  return Response.json(response)
}