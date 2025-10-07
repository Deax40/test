import { prisma } from './prisma'

function toNullableDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date
}

function buildPersistencePayload(tool, extras = {}) {
  if (!tool) return null

  const payload = {}

  const simpleFields = [
    'name',
    'location',
    'state',
    'weight',
    'imoNumber',
    'lastScanLieu',
    'lastScanEtat',
    'client',
    'transporteur',
    'tracking',
    'dimensionLength',
    'dimensionWidth',
    'dimensionHeight',
    'dimensionType',
    'problemDescription',
    'complementaryInfo',
  ]

  for (const field of simpleFields) {
    if (tool[field] !== undefined) {
      payload[field] = tool[field] ?? null
    }
  }

  if (tool.lastScanBy !== undefined) {
    payload.lastScanUser = tool.lastScanBy ?? null
  }

  if (tool.updatedBy !== undefined) {
    payload.updatedBy = tool.updatedBy ?? null
  }

  if (tool.lastProblemReportedBy !== undefined) {
    payload.lastProblemReportedBy = tool.lastProblemReportedBy ?? null
  }

  const lastScanAt = toNullableDate(tool.lastScanAt)
  if (lastScanAt) {
    payload.lastScanAt = lastScanAt
  }

  const updatedAt = toNullableDate(tool.updatedAt)
  if (updatedAt) {
    payload.updatedAt = updatedAt
  }

  if ('problemPhotoBuffer' in extras) {
    payload.problemPhotoBuffer = extras.problemPhotoBuffer ?? null
  }

  if ('problemPhotoType' in extras) {
    payload.problemPhotoType = extras.problemPhotoType ?? null
  }

  return payload
}

export async function persistCommunTool(tool, extras = {}) {
  if (!tool?.hash) return null

  const hash = String(tool.hash).trim().toLowerCase()
  const payload = buildPersistencePayload(tool, extras)

  if (!payload || Object.keys(payload).length === 0) {
    return null
  }

  try {
    return await prisma.tool.update({
      where: { hash },
      data: payload,
    })
  } catch (error) {
    if (error?.code !== 'P2025') {
      throw error
    }

    const createData = {
      hash,
      qrData: tool.qrData || hash,
      name: tool.name || 'Outil',
      category: tool.category || 'COMMUN',
      ...payload,
    }

    return prisma.tool.create({ data: createData })
  }
}

