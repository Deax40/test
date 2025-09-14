import { COMMUN_TOOLS } from './commun-tools'
import crypto from 'crypto'

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

const tools = new Map(
  COMMUN_TOOLS.map(t => [
    normalizeHash(t.hash),
    {
      hash: normalizeHash(t.hash),
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
  ])
)

const editTokens = new Map()
const audits = []

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

export function startScan(hash, scannedBy) {
  const normHash = normalizeHash(hash)
  console.log('startScan', { input: hash, normalized: normHash })
  const tool = tools.get(normHash)
  if (!tool) return null
  const now = parisNow()
  tool.lastScanAt = now
  const who = scannedBy.trim()
  tool.lastScanBy = who
  const token = createToken(normHash, who)
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
