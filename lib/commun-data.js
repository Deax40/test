import { COMMUN_TOOLS } from './commun-tools'
import crypto from 'crypto'

// Ensure data persists across module reloads and API route instances
// by storing the mutable state on the global object. This allows the
// scan page and the common page to share the same dataset even when
// the modules are imported in different requests.
const globalState = globalThis.__communData || {
  tools: new Map(
    COMMUN_TOOLS.map(t => [
      String(t.hash).trim().toLowerCase(),
      {
        hash: String(t.hash).trim().toLowerCase(),
        name: t.name,
        location: '',
        state: '',
        lastScanAt: null,
        lastScanBy: '',
        weight: '',
        imoNumber: '',
        updatedAt: null,
        updatedBy: '',
      },
    ]),
  ),
  editTokens: new Map(),
  audits: [],
}

// Persist reference on the global object so subsequent imports reuse it
globalThis.__communData = globalState

const tools = globalState.tools
const editTokens = globalState.editTokens
const audits = globalState.audits

function normalizeHash(hash) {
  return String(hash).trim().toLowerCase()
}

function parisNow() {
  const now = new Date()
  const paris = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Paris' })
  )
  const offset = -paris.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0')
  const iso = paris.toISOString().slice(0, 19)
  return `${iso}${sign}${pad(offset / 60)}:${pad(offset % 60)}`
}


export function listTools() {
  return Array.from(tools.values())
}

export function getTool(hash) {
  return tools.get(normalizeHash(hash)) || null
}

export function createToken(hash, userId) {
  const token = crypto.randomUUID()
  editTokens.set(token, {
    hash: normalizeHash(hash),
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })
  return token
}

export function consumeToken(token, hash) {
  const session = editTokens.get(token)
  if (!session) return null
  if (session.hash !== normalizeHash(hash)) return null
  if (session.expiresAt < Date.now()) {
    editTokens.delete(token)
    return null
  }
  editTokens.delete(token)
  return session.userId
}

function findToolByName(name) {
  const target = String(name).trim()
  for (const tool of tools.values()) {
    if (tool.name.trim() === target) return tool
  }
  return null
}

export function startScan({ hash, name, scannedBy = '' }) {
  const normHash = hash ? normalizeHash(hash) : null
  const normName = name ? String(name).trim() : null
  let tool = null
  if (normHash) {
    tool = tools.get(normHash)
  }
  if (!tool && normName) {
    tool = findToolByName(normName)
  }
  if (!tool) return null
  const now = parisNow()
  tool.lastScanAt = now
  const who = scannedBy ? scannedBy.trim() : ''
  if (who) {
    tool.lastScanBy = who
  }
  const token = createToken(tool.hash, who || 'scan')
  return { token, tool }
}

export function patchTool(hash, data, userId) {
  const normHash = normalizeHash(hash)
  const tool = tools.get(normHash)
  if (!tool) return null
  const before = { ...tool }
  Object.assign(tool, data, {
    updatedAt: parisNow(),
    updatedBy: userId,
  })
  const after = { ...tool }
  audits.push({
    when: tool.updatedAt,
    who: userId,
    hash: normHash,
    before,
    after,
    source: 'scan',
  })
  return tool
}

export function getAudits() {
  return audits
}
