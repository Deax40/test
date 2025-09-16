import { COMMUN_TOOLS } from './commun-tools'
import { prisma } from './prisma'
import crypto from 'crypto'

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

function normalizeHash(hash) {
  return String(hash || '').trim().toLowerCase()
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
    dimensions: sanitizeString(
      raw?.dimensions ?? raw?.dimension ?? defaults.dimensions ?? ''
    ),
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

const baseTools = []
const baseByHash = new Map()
const baseByName = new Map()

for (const tool of COMMUN_TOOLS) {
  const normalized = normalizeToolRecord(tool)
  if (!normalized.hash) continue
  baseTools.push(normalized)
  baseByHash.set(normalized.hash, normalized)
  if (normalized.name) {
    baseByName.set(normalized.name.trim().toLowerCase(), normalized)
  }
}

let editTokens = globalThis.__communEditTokens
if (!editTokens) {
  editTokens = new Map()
  globalThis.__communEditTokens = editTokens
}

let audits = globalThis.__communAudits
if (!audits) {
  audits = []
  globalThis.__communAudits = audits
}

function mergeWithBase(base, record) {
  if (record) {
    return normalizeToolRecord(record, base || {})
  }
  if (base) {
    return normalizeToolRecord({}, base)
  }
  return null
}

async function fetchExisting(hash) {
  if (!hash) return null
  const stored = await prisma.commonTool.findUnique({ where: { hash } })
  return stored
}

export async function listTools() {
  const stored = await prisma.commonTool.findMany()
  const byHash = new Map(stored.map(tool => [tool.hash, tool]))
  const results = []

  for (const base of baseTools) {
    const record = byHash.get(base.hash)
    results.push(mergeWithBase(base, record))
    if (record) byHash.delete(base.hash)
  }

  for (const record of byHash.values()) {
    const fallback = {
      hash: record.hash,
      name: record.name || record.hash,
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
    results.push(mergeWithBase(normalizeToolRecord(fallback), record))
  }

  return results
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))
}

export async function getTool(hash) {
  const normHash = normalizeHash(hash)
  if (!normHash) return null
  const base = baseByHash.get(normHash)
  const stored = await fetchExisting(normHash)
  if (!base && !stored) return null
  const fallback =
    base ||
    normalizeToolRecord({
      hash: normHash,
      name: stored?.name || '',
    })
  return mergeWithBase(fallback, stored)
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

function findBaseByName(name) {
  const key = sanitizeString(name).toLowerCase()
  if (!key) return null
  return baseByName.get(key) || null
}

export async function startScan({ hash, name, scannedBy = '' }) {
  const normHash = hash ? normalizeHash(hash) : null
  const baseByHashResult = normHash ? baseByHash.get(normHash) : null
  const baseByNameResult = name ? findBaseByName(name) : null

  let base = baseByHashResult || baseByNameResult || null

  if (!base && normHash) {
    const stored = await fetchExisting(normHash)
    if (stored) {
      base = normalizeToolRecord({
        hash: normHash,
        name: stored.name || sanitizeString(name),
      })
    }
  }

  if (!base) return null

  const targetHash = base.hash
  const existing = await fetchExisting(targetHash)
  const now = parisNow()
  const who = sanitizeString(scannedBy)

  const update = {
    name: base.name || existing?.name || sanitizeString(name),
    lastScanAt: now,
    updatedAt: now,
  }

  if (who) {
    update.lastScanBy = who
    update.updatedBy = who
  } else if (existing?.lastScanBy) {
    update.lastScanBy = existing.lastScanBy
  }

  let lastUser = existing?.lastUser || ''
  if (!lastUser && who) {
    lastUser = who
  }
  if (lastUser) {
    update.lastUser = lastUser
  }

  const stored = await prisma.commonTool.upsert({
    where: { hash: targetHash },
    update,
    create: {
      hash: targetHash,
      name: base.name || sanitizeString(name),
      contact: existing?.contact || '',
      weight: existing?.weight || '',
      date: existing?.date || '',
      lastUser: lastUser || '',
      dimensions: existing?.dimensions || '',
      lastScanAt: now,
      lastScanBy: who,
      updatedAt: now,
      updatedBy: who,
    },
  })

  const token = createToken(targetHash, who || 'scan')
  const tool = mergeWithBase(base, stored)
  return { token, tool }
}

export async function patchTool(hash, data, userId) {
  const normHash = normalizeHash(hash)
  if (!normHash) return null
  const base = baseByHash.get(normHash)
  const existing = await fetchExisting(normHash)
  if (!base && !existing) return null

  const now = parisNow()
  const who = sanitizeString(userId)
  const patch = {}

  if (typeof data?.name === 'string') patch.name = sanitizeString(data.name)
  if (typeof data?.contact === 'string') patch.contact = sanitizeString(data.contact)
  if (typeof data?.weight === 'string') patch.weight = sanitizeString(data.weight)
  if (typeof data?.date === 'string') patch.date = sanitizeString(data.date)
  if (typeof data?.lastUser === 'string') patch.lastUser = sanitizeString(data.lastUser)
  if (typeof data?.dimensions === 'string') patch.dimensions = sanitizeString(data.dimensions)
  if (typeof data?.user === 'string' && !patch.lastUser) {
    patch.lastUser = sanitizeString(data.user)
  }

  const update = {
    updatedAt: now,
  }
  if (who) {
    update.updatedBy = who
  } else if (existing?.updatedBy) {
    update.updatedBy = existing.updatedBy
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      update[key] = value
    }
  }

  if (!update.lastUser && update.updatedBy && !existing?.lastUser) {
    update.lastUser = update.updatedBy
  }

  const before = mergeWithBase(base, existing)

  const stored = await prisma.commonTool.upsert({
    where: { hash: normHash },
    update,
    create: {
      hash: normHash,
      name: patch.name || base?.name || existing?.name || '',
      contact: patch.contact || '',
      weight: patch.weight || '',
      date: patch.date || '',
      lastUser: patch.lastUser || update.updatedBy || '',
      dimensions: patch.dimensions || '',
      lastScanAt: existing?.lastScanAt || null,
      lastScanBy: existing?.lastScanBy || '',
      updatedAt: now,
      updatedBy: update.updatedBy || '',
    },
  })

  const after = mergeWithBase(base, stored)
  audits.push({
    when: stored.updatedAt || now,
    who: update.updatedBy || '',
    hash: normHash,
    before,
    after,
    source: 'scan',
  })

  return after
}

export function getAudits() {
  return [...audits]
}
