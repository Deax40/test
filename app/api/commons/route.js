import { listTools } from '@/lib/commun-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const tools = await listTools()
  return Response.json({ tools })
}
