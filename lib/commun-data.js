import { COMMUN_TOOLS } from './commun-tools'

// In-memory store for COMMUN tools and scan logs
const tools = new Map(
  COMMUN_TOOLS.map(t => [
    t.hash,
    {
      hash: t.hash,
      name: t.name,
      site: '',
      status: 'Disponible',
      holder: '',
      notes: '',
      updatedAt: new Date().toISOString(),
      extra: {}
    }
  ])
)

const scans = []

export function getTool(hash) {
  return tools.get(hash) || null
}

export function patchTool(hash, data) {
  const tool = tools.get(hash)
  if (!tool) return null
  Object.assign(tool, data, { updatedAt: new Date().toISOString() })
  return tool
}

export function addScan(log) {
  const entry = { id: String(scans.length + 1), ...log }
  scans.push(entry)
  return entry
}
