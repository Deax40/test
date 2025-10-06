import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'care-data.json')
const CARE_TOOLS_DIR = path.join(process.cwd(), 'Care Tools')

function loadState() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    }
  } catch {
    return { tools: [], logs: [] }
  }
}

function loadToolsFromFiles() {
  const tools = []
  try {
    if (!fs.existsSync(CARE_TOOLS_DIR)) {
      return tools
    }

    const files = fs.readdirSync(CARE_TOOLS_DIR)
    for (const file of files) {
      if (path.extname(file) === '.bs') {
        const filePath = path.join(CARE_TOOLS_DIR, file)
        const stats = fs.statSync(filePath)
        const hash = crypto.createHash('md5').update(file).digest('hex').substring(0, 8).toUpperCase()

        tools.push({
          hash,
          name: path.basename(file, '.bs'),
          category: 'Care Tools',
          qrData: `CARE_${hash}`,
          fileName: file,
          filePath,
          fileSize: stats.size,
          fileExtension: '.bs',
          lastScanAt: null,
          lastScanUser: null,
          lastScanLieu: null,
          lastScanEtat: 'RAS',
          ouEstAppareil: null,
          typeEnvoi: 'Envoi',
          transporteur: null,
          tracking: null,
          client: null,
          problemDescription: null,
          problemPhoto: null,
          createdAt: stats.birthtime.toISOString(),
        })
      }
    }
  } catch (error) {
    console.error('Error loading care tools from files:', error)
  }
  return tools
}

const persisted = loadState()
const fileTools = loadToolsFromFiles()

// Merge file tools with persisted data
const mergedTools = new Map()
fileTools.forEach(tool => {
  mergedTools.set(tool.hash, tool)
})

// Override with persisted data if exists
persisted.tools.forEach(tool => {
  if (mergedTools.has(tool.hash)) {
    const fileTool = mergedTools.get(tool.hash)
    mergedTools.set(tool.hash, {
      ...fileTool,
      ...tool,
      // Keep file metadata from file system
      fileName: fileTool.fileName,
      filePath: fileTool.filePath,
      fileSize: fileTool.fileSize,
      fileExtension: fileTool.fileExtension,
    })
  }
})

const globalState = globalThis.__careData || {
  tools: mergedTools,
  logs: persisted.logs,
  editTokens: new Map(),
}

globalThis.__careData = globalState

const tools = globalState.tools
const logs = globalState.logs
const editTokens = globalState.editTokens

function normalizeHash(hash) {
  return String(hash).trim().toUpperCase()
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

export function updateToolWithToken(hash, data, token, userName) {
  const userId = consumeToken(token, hash)
  if (!userId) return null

  const normHash = normalizeHash(hash)
  const tool = tools.get(normHash)
  if (!tool) return null

  const before = { ...tool }
  const now = parisNow()

  // Track changes for logging
  Object.keys(data).forEach(field => {
    if (tool[field] !== data[field]) {
      addLog(tool.hash, 'MODIFY', field, tool[field], data[field], userName || userId)
    }
  })

  Object.assign(tool, data, {
    updatedAt: now,
    updatedBy: userId,
    lastScanAt: now,
    lastScanUser: userName || userId
  })

  // Create new token for continued editing
  const newToken = createToken(tool.hash, userId)

  persistState()
  return { tool, token: newToken }
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
    tool.lastScanUser = who
  }

  // Log the scan action
  addLog(tool.hash, 'SCAN', null, null, null, who)

  const token = createToken(tool.hash, who || 'scan')
  persistState()
  return { token, tool }
}

export function updateTool(hash, data, userId, userName) {
  const normHash = normalizeHash(hash)
  const tool = tools.get(normHash)
  if (!tool) return null

  const before = { ...tool }
  const now = parisNow()

  // Track changes for logging
  Object.keys(data).forEach(field => {
    if (tool[field] !== data[field]) {
      addLog(tool.hash, 'MODIFY', field, tool[field], data[field], userName || userId)
    }
  })

  Object.assign(tool, data, {
    updatedAt: now,
    updatedBy: userId,
  })

  persistState()
  return tool
}

export function addLog(toolHash, action, field, oldValue, newValue, userName) {
  const log = {
    id: crypto.randomUUID(),
    toolHash,
    action,
    field,
    oldValue,
    newValue,
    userName: userName || 'Système',
    createdAt: parisNow(),
  }

  logs.push(log)

  // Keep only the 7 most recent logs for each tool
  cleanupLogs(toolHash)

  return log
}

function cleanupLogs(toolHash) {
  const toolLogs = logs.filter(log => log.toolHash === toolHash)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (toolLogs.length > 7) {
    const logsToKeep = toolLogs.slice(0, 7)
    const logsToRemove = toolLogs.slice(7)

    // Remove old logs from the global logs array
    logsToRemove.forEach(logToRemove => {
      const index = logs.findIndex(log => log.id === logToRemove.id)
      if (index !== -1) {
        logs.splice(index, 1)
      }
    })
  }
}

export function getLogs(toolHash = null) {
  if (toolHash) {
    return logs.filter(log => log.toolHash === normalizeHash(toolHash))
  }
  return logs
}

export function clearLogs() {
  logs.length = 0
  persistState()
  return true
}

function persistState() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    const payload = {
      tools: Array.from(tools.values()),
      logs,
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2))
  } catch (e) {
    console.error('Failed to persist care data', e)
  }
}

export function refreshToolsFromFiles() {
  const fileTools = loadToolsFromFiles()

  fileTools.forEach(tool => {
    const existing = tools.get(tool.hash)
    if (existing) {
      // Update file metadata but keep scan data
      existing.fileName = tool.fileName
      existing.filePath = tool.filePath
      existing.fileSize = tool.fileSize
      existing.fileExtension = tool.fileExtension
    } else {
      // New tool
      tools.set(tool.hash, tool)
      addLog(tool.hash, 'CREATE', null, null, null, 'Système')
    }
  })

  persistState()
  return Array.from(tools.values())
}