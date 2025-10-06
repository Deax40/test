import { listTools, refreshToolsFromFiles } from '@/lib/care-data'

export async function GET() {
  // Refresh tools from files to get latest data
  const tools = refreshToolsFromFiles()
  return Response.json({ tools })
}