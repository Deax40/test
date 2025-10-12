import { prisma } from '@/lib/prisma'

/**
 * Get all Care tools from Prisma database
 */
export async function listTools() {
  try {
    const tools = await prisma.tool.findMany({
      where: {
        category: 'Care Tools'
      },
      orderBy: {
        name: 'asc'
      }
    })
    return tools
  } catch (error) {
    console.error('[CARE-PRISMA] Error listing tools:', error)
    return []
  }
}

/**
 * Get a single Care tool by hash
 */
export async function getTool(hash) {
  try {
    const normalized = String(hash).trim().toUpperCase()
    const tool = await prisma.tool.findUnique({
      where: { hash: normalized }
    })
    return tool
  } catch (error) {
    console.error('[CARE-PRISMA] Error getting tool:', error)
    return null
  }
}

/**
 * Update a Care tool
 */
export async function updateTool(hash, data) {
  try {
    const normalized = String(hash).trim().toUpperCase()

    // Prepare update data
    const updateData = {
      lastScanAt: data.lastScanAt ? new Date(data.lastScanAt) : new Date(),
      lastScanUser: data.lastScanUser || null,
      lastScanLieu: data.lastScanLieu || null,
      lastScanEtat: data.lastScanEtat || 'RAS',
      problemDescription: data.problemDescription || null,
    }

    // Add photo if present
    if (data.problemPhotoBuffer) {
      updateData.problemPhotoBuffer = data.problemPhotoBuffer
      updateData.problemPhotoType = data.problemPhotoType
    }

    // Upsert (create if doesn't exist, update if exists)
    const tool = await prisma.tool.upsert({
      where: { hash: normalized },
      update: updateData,
      create: {
        hash: normalized,
        name: data.name || `Tool ${normalized}`,
        category: 'Care Tools',
        qrData: `CARE_${normalized}`,
        ...updateData
      }
    })

    console.log('[CARE-PRISMA] Tool updated:', tool.id, tool.name)
    return tool
  } catch (error) {
    console.error('[CARE-PRISMA] Error updating tool:', error)
    throw error
  }
}

/**
 * Create a log entry for a Care tool
 */
export async function addLog(toolHash, action, field, oldValue, newValue, userName) {
  try {
    const log = await prisma.careLog.create({
      data: {
        tool: {
          connect: { hash: String(toolHash).trim().toUpperCase() }
        },
        action: action || 'MODIFY',
        field: field || null,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
        userName: userName || 'Système'
      }
    })

    console.log('[CARE-PRISMA] Log created:', log.id)
    return log
  } catch (error) {
    console.error('[CARE-PRISMA] Error creating log:', error)
    return null
  }
}

/**
 * Get logs for a specific tool
 */
export async function getLogs(toolHash = null) {
  try {
    if (toolHash) {
      const normalized = String(toolHash).trim().toUpperCase()
      const logs = await prisma.careLog.findMany({
        where: {
          tool: {
            hash: normalized
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
      return logs
    }

    // Get all logs
    const logs = await prisma.careLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })
    return logs
  } catch (error) {
    console.error('[CARE-PRISMA] Error getting logs:', error)
    return []
  }
}
