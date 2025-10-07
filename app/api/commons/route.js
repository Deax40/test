import { listTools } from '@/lib/commun-data'

export async function GET() {
  const tools = await listTools()
  return Response.json({ tools })
}
