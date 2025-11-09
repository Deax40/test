import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  console.log('[SCAN] Start scan request')

  const contentType = req.headers.get('content-type') || ''
  let hash, name, scannedBy = '', raw = ''

  if (contentType.includes('application/json')) {
    try {
      const body = await req.json()
      hash = body.hash
      name = body.name
      scannedBy = body.scannedBy || ''
    } catch {
      return Response.json(
        { error: 'bad_request', hint: 'expecting hash|name|raw' },
        { status: 400 }
      )
    }
  } else {
    raw = await req.text()
  }

  if (!hash && !name && raw) {
    const candidate = raw.trim()
    // Check for CARE_ prefix
    if (candidate.startsWith('CARE_')) {
      hash = candidate.replace('CARE_', '')
    } else if (/^[a-fA-F0-9]{64}$/.test(candidate)) {
      hash = candidate.toLowerCase()
    } else if (/^[a-fA-F0-9]{8}$/.test(candidate.toUpperCase())) {
      // Care tool hash format
      hash = candidate.toUpperCase()
    } else {
      name = candidate
    }
  }

  if (!hash && !name) {
    return Response.json(
      { error: 'bad_request', hint: 'expecting hash|name|raw' },
      { status: 400 }
    )
  }

  console.log('[SCAN] Looking for tool:', { hash, name })

  // Search in Prisma database
  let tool = null
  let source = 'unknown'

  try {
    if (hash) {
      const normalized = String(hash).trim().toUpperCase()
      // Try exact hash match
      tool = await prisma.tool.findUnique({
        where: { hash: normalized }
      })

      // Try qrData match
      if (!tool) {
        tool = await prisma.tool.findFirst({
          where: {
            OR: [
              { qrData: { contains: normalized, mode: 'insensitive' } },
              { qrData: { contains: `CARE_${normalized}`, mode: 'insensitive' } },
              { qrData: { contains: `COMMUN_${normalized}`, mode: 'insensitive' } }
            ]
          }
        })
      }
    }

    if (!tool && name) {
      tool = await prisma.tool.findFirst({
        where: {
          name: { contains: name, mode: 'insensitive' }
        }
      })
    }

    if (!tool) {
      console.log('[SCAN] ⚠️ Tool not found')
      return Response.json({ error: 'tool_not_found' }, { status: 404 })
    }

    // Determine source from category
    if (tool.category?.toLowerCase().includes('care')) {
      source = 'care'
    } else if (tool.category?.toLowerCase().includes('commun')) {
      source = 'commun'
    } else {
      source = 'tool'
    }

    console.log('[SCAN] ✅ Tool found:', tool.name, 'Category:', tool.category, 'Source:', source)

    return Response.json({
      tool: {
        ...tool,
        lastScanAt: tool.lastScanAt?.toISOString() || null,
        createdAt: tool.createdAt?.toISOString() || null
      },
      source,
      editSessionToken: null // Not used anymore, direct Prisma saves
    })
  } catch (error) {
    console.error('[SCAN] ❌ Error:', error.message)
    return Response.json({
      error: 'Database error',
      details: error.message
    }, { status: 500 })
  }
}
