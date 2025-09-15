import { COMMUN_TOOLS } from './commun-tools'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Persist data to disk so that updates survive across separate API
// route invocations. In serverless environments each request may run
// in isolation, therefore we store the mutable state in a JSON file
// and bootstrap it on module load.
const DATA_FILE = path.join(process.cwd(), 'data', 'commun-data.json')

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullable(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  return String(value)
}

function normalizeToolRecord(raw, defaults = {}) {
  const result = {
    hash: normalizeHash(raw?.hash ?? raw?.qrData ?? defaults.hash ?? ''),
    name: sanitizeString(raw?.name ?? defaults.name ?? ''),
    contact: sanitizeString(
      raw?.contact ??
        raw?.contactInfo ??
        raw?.number ??
        raw?.email ??
        raw?.phone ??
        defaults.contact ??
        ''
    ),
    weight: sanitizeString(raw?.weight ?? defaults.weight ?? ''),
    date: sanitizeString(
      raw?.date ??
        defaults.date ??
        (typeof raw?.lastScanAt === 'string' ? raw.lastScanAt : '')
    ),
    lastUser: sanitizeString(
      raw?.lastUser ?? raw?.lastScanBy ?? raw?.user ?? defaults.lastUser ?? ''
    ),
    dimensions: sanitizeString(raw?.dimensions ?? raw?.dimension ?? defaults.dimensions ?? ''),
    lastScanAt: normalizeNullable(
      raw?.lastScanAt ?? defaults.lastScanAt ?? null
    ),
    lastScanBy: sanitizeString(raw?.lastScanBy ?? defaults.lastScanBy ?? ''),
    updatedAt: normalizeNullable(
      raw?.updatedAt ?? defaults.updatedAt ?? null
    ),
    updatedBy: sanitizeString(raw?.updatedBy ?? defaults.updatedBy ?? ''),
  }

  if (!result.name) {
    result.name = sanitizeString(defaults.name ?? raw?.name ?? '')
  }

  return result
}

function loadState() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : [],
    }
  } catch {
    return { tools: [], audits: [] }
  }
}

const persisted = loadState()

// Ensure data persists across module reloads and API route instances
// by storing the mutable state on the global object. This allows the
// scan page and the common page to share the same dataset even when
// the modules are imported in different requests.
function buildInitialTools() {
  const map = new Map()

  for (const tool of COMMUN_TOOLS) {
    const normalized = normalizeToolRecord(tool)
    if (!normalized.hash) continue
    if (!normalized.name) normalized.name = tool.name || ''
    map.set(normalized.hash, normalized)
  }

  if (persisted.tools.length) {
    for (const raw of persisted.tools) {
      const existing = map.get(normalizeHash(raw?.hash ?? raw?.qrData ?? '')) || {
        hash: normalizeHash(raw?.hash ?? raw?.qrData ?? ''),
        name: '',
        contact: '',
        weight: '',
        date: '',
        lastUser: '',
        dimensions: '',
        lastScanAt: null,
        lastScanBy: '',
        updatedAt: null,
        updatedBy: '',
      }
      const normalized = normalizeToolRecord(raw, existing)
      if (!normalized.hash) continue
      if (!normalized.name && existing.name) {
        normalized.name = existing.name
      }
      map.set(normalized.hash, normalized)
    }
  }

  return map
}

const initialTools = buildInitialTools()

let globalState = globalThis.__communData
if (globalState) {
  for (const [hash, normalized] of initialTools) {
    const existing = globalState.tools.get(hash)
    if (existing) {
      globalState.tools.set(hash, normalizeToolRecord(existing, normalized))
    } else {
      globalState.tools.set(hash, normalized)
    }
  }
} else {
  globalState = {
    tools: initialTools,
    editTokens: new Map(),
    audits: persisted.audits,
  }
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
  return Array.from(tools.values(), tool => ({ ...tool })).sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  )
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
  const who = sanitizeString(scannedBy)
  if (who) {
    tool.lastScanBy = who
    if (!tool.lastUser) {
      tool.lastUser = who
    }
  }
  const token = createToken(tool.hash, who || 'scan')
  persistState()
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
  persistState()
  return tool
}

export function getAudits() {
  return audits
}

function persistState() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    const payload = {
      tools: Array.from(tools.values()),
      audits,
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2))
  } catch (e) {
    console.error('Failed to persist commun data', e)
  }
}
