import { COMMUN_TOOLS } from './commun-tools'
import { prisma } from './prisma'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Persist data to disk so that updates survive across separate API
// route invocations. In serverless environments each request may run
// in isolation, therefore we store the mutable state in a JSON file
// and bootstrap it on module load.
const DATA_FILE = path.join(process.cwd(), 'data', 'commun-data.json')

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

let hasLoadedFromDatabase = false
let loadFromDatabasePromise = null

// Ensure data persists across module reloads and API route instances
// by storing the mutable state on the global object. This allows the
// scan page and the common page to share the same dataset even when
// the modules are imported in different requests.
const globalState = globalThis.__communData || {
  tools: new Map(
    (persisted.tools.length ? persisted.tools : COMMUN_TOOLS).map(t => [
      String(t.hash).trim().toLowerCase(),
      {
        hash: String(t.hash).trim().toLowerCase(),
        name: t.name,
        location: t.location || '',
        state: t.state || '',
        lastScanAt: t.lastScanAt || null,
        lastScanBy: t.lastScanBy || '',
        lastScanLieu: t.lastScanLieu || '',
        weight: t.weight || '',
        imoNumber: t.imoNumber || '',
        updatedAt: t.updatedAt || null,
        updatedBy: t.updatedBy || '',
        lastProblemReportedBy: t.lastProblemReportedBy || '',
        problemDescription: t.problemDescription || null,
      },
    ]),
  ),
  editTokens: new Map(),
  audits: persisted.audits,
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


async function loadToolsFromDatabase() {
  try {
    const records = await prisma.tool.findMany({ where: { category: 'COMMUN' } })
    for (const record of records) {
      const hash = normalizeHash(record.hash || record.qrData || '')
      if (!hash) continue
      const existing = tools.get(hash) || {
        hash,
        name: record.name || '',
      }
      tools.set(hash, {
        ...existing,
        name: record.name || existing.name || '',
        location: record.location || existing.location || '',
        state: record.state || existing.state || '',
        weight: record.weight || existing.weight || '',
        imoNumber: record.imoNumber || existing.imoNumber || '',
        lastScanAt: record.lastScanAt ? record.lastScanAt.toISOString() : existing.lastScanAt || null,
        lastScanBy: record.lastScanUser || existing.lastScanBy || '',
        lastScanLieu: record.lastScanLieu || existing.lastScanLieu || '',
        lastScanEtat: record.lastScanEtat || existing.lastScanEtat || '',
        updatedAt: record.updatedAt ? record.updatedAt.toISOString() : existing.updatedAt || null,
        updatedBy: record.updatedBy || existing.updatedBy || '',
        lastProblemReportedBy: record.lastProblemReportedBy || existing.lastProblemReportedBy || '',
        client: record.client || existing.client || '',
        transporteur: record.transporteur || existing.transporteur || '',
        tracking: record.tracking || existing.tracking || '',
        dimensionLength: record.dimensionLength || existing.dimensionLength || '',
        dimensionWidth: record.dimensionWidth || existing.dimensionWidth || '',
        dimensionHeight: record.dimensionHeight || existing.dimensionHeight || '',
        dimensionType: record.dimensionType || existing.dimensionType || '',
        problemDescription: record.problemDescription ?? existing.problemDescription ?? null,
        complementaryInfo: record.complementaryInfo || existing.complementaryInfo || '',
        problemPhotoPath: record.problemPhotoPath || existing.problemPhotoPath || null,
        qrData: record.qrData || existing.qrData || hash,
        category: record.category || existing.category || 'COMMUN',
      })
    }
  } catch (error) {
    console.error('Failed to load commun tools from database', error)
  } finally {
    hasLoadedFromDatabase = true
    loadFromDatabasePromise = null
  }
}

export async function ensureCommunDataLoaded() {
  if (hasLoadedFromDatabase || loadFromDatabasePromise) {
    if (loadFromDatabasePromise) {
      await loadFromDatabasePromise
    }
    return
  }
  if (!process.env.DATABASE_URL) {
    hasLoadedFromDatabase = true
    return
  }
  loadFromDatabasePromise = loadToolsFromDatabase()
  await loadFromDatabasePromise
}

export async function listTools() {
  await ensureCommunDataLoaded()
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
  persistState()
  return { token, tool }
}

export function patchTool(hash, data, userId) {
  const normHash = normalizeHash(hash)
  const tool = tools.get(normHash)
  if (!tool) return null
  const before = { ...tool }

  // Update the tool with new data
  Object.assign(tool, data, {
    updatedAt: parisNow(),
    updatedBy: userId,
  })

  // If state is updated, also update lastScanEtat for consistency
  if (data.state !== undefined) {
    tool.lastScanEtat = data.state
  }

  // If state is "Problème" and problemDescription exists, update lastProblemReportedBy
  if (data.state === 'Problème' && data.problemDescription) {
    tool.lastProblemReportedBy = userId
    tool.problemDescription = data.problemDescription
  }

  const after = { ...tool }
  audits.push({
    when: tool.updatedAt,
    who: userId,
    hash: normHash,
    before,
    after,
    source: 'admin_edit',
  })
  persistState()
  return tool
}

// Alias for compatibility
export const updateTool = patchTool

export function getAudits() {
  return audits
}

function persistState() {
  // On Vercel, we can't write to filesystem
  // Data is already persisted in Prisma database via API calls
  // This function is kept for backward compatibility but does nothing in production
  if (process.env.VERCEL) {
    return
  }

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
