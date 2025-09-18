import { listTools } from '@/lib/commun-data'

export async function GET() {
  return Response.json({ tools: listTools() })
}
