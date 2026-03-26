import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Supprime les accents, apostrophes, tirets et normalise pour la recherche
function normalizeStr(str) {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // supprime les diacritiques (é→e, à→a…)
    .replace(/[''`´ʼ]/g, '')           // supprime les apostrophes (droites et courbes)
    .replace(/[-_()[\]]/g, ' ')        // remplace tirets/underscores/parenthèses par espace
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    if (candidate.startsWith('CARE_')) {
      hash = candidate.replace('CARE_', '')
    } else if (candidate.startsWith('COMMUN_')) {
      hash = candidate.replace('COMMUN_', '')
    } else if (/^[a-fA-F0-9]{64}$/.test(candidate)) {
      hash = candidate.toUpperCase()
    } else if (/^[a-fA-F0-9]{8}$/.test(candidate.toUpperCase())) {
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

  let tool = null
  let source = 'unknown'

  try {
    // --- Niveau 1 : recherche par hash exact (case-insensitive) ---
    if (hash) {
      const normalized = String(hash).trim().toUpperCase()

      tool = await prisma.tool.findFirst({
        where: {
          OR: [
            { hash: normalized },
            { hash: normalized.toLowerCase() },
          ]
        }
      })

      // --- Niveau 2 : recherche dans qrData ---
      if (!tool) {
        tool = await prisma.tool.findFirst({
          where: {
            OR: [
              { qrData: { contains: normalized, mode: 'insensitive' } },
              { qrData: { contains: `CARE_${normalized}`, mode: 'insensitive' } },
              { qrData: { contains: `COMMUN_${normalized}`, mode: 'insensitive' } },
              { qrData: { contains: `TOOL_${normalized}`, mode: 'insensitive' } },
            ]
          }
        })
      }

      // --- Niveau 3 : le hash QR est peut-être SHA-256 du nom de fichier ---
      // Badge Studio peut générer des QR avec SHA-256 du filename
      if (!tool && normalized.length === 64) {
        const allTools = await prisma.tool.findMany({
          select: { id: true, hash: true, name: true, fileName: true, category: true,
                    lastScanAt: true, lastScanUser: true, lastScanLieu: true,
                    lastScanEtat: true, client: true, tracking: true, transporteur: true,
                    complementaryInfo: true, problemDescription: true, typeEnvoi: true,
                    weight: true, imoNumber: true, qrData: true, createdAt: true }
        })

        for (const t of allTools) {
          // Teste SHA-256 du fileName ET du name courant (résiste au rename)
          // Essaie plusieurs variantes de normalisation Unicode et d'encodage
          // pour couvrir Badge Studio (Windows latin-1, macOS NFD, etc.)
          const base = [
            t.fileName,
            t.fileName ? t.fileName.replace(/\.bs$/i, '') : null,
            t.name,
          ].filter(Boolean)

          const variants = []
          for (const b of base) {
            variants.push(b)                          // brut (UTF-8 NFC par défaut JS)
            variants.push(b.normalize('NFC'))          // Windows Unicode
            variants.push(b.normalize('NFD'))          // macOS Unicode
            variants.push(normalizeStr(b))             // sans accents/lowercase
          }

          let found = false
          for (const v of variants) {
            // UTF-8 (standard) puis Latin-1 (Windows-1252 pour les accents)
            for (const enc of ['utf8', 'latin1']) {
              const sha = crypto.createHash('sha256')
                .update(Buffer.from(v, enc))
                .digest('hex').toUpperCase()
              if (sha === normalized) { tool = t; found = true; break }
            }
            if (found) break
          }
          if (tool) break
        }
      }
    }

    // --- Niveau 4 : recherche par nom exact (insensitive) ---
    if (!tool && name) {
      tool = await prisma.tool.findFirst({
        where: { name: { contains: name, mode: 'insensitive' } }
      })
    }

    // --- Niveau 5 : recherche par nom sans accents ---
    if (!tool) {
      const searchStr = normalizeStr(name || hash || '')
      if (searchStr.length >= 3) {
        const allTools = await prisma.tool.findMany({
          select: { id: true, hash: true, name: true, fileName: true, category: true,
                    lastScanAt: true, lastScanUser: true, lastScanLieu: true,
                    lastScanEtat: true, client: true, tracking: true, transporteur: true,
                    complementaryInfo: true, problemDescription: true, typeEnvoi: true,
                    weight: true, imoNumber: true, qrData: true, createdAt: true }
        })

        for (const t of allTools) {
          const normName = normalizeStr(t.name)
          const normFile = normalizeStr(t.fileName || '')
          const normQr = normalizeStr(t.qrData || '')
          if (
            normName === searchStr ||
            normName.includes(searchStr) ||
            (normName.length >= 3 && searchStr.includes(normName)) ||
            (normFile.length >= 3 && normFile.includes(searchStr)) ||
            (normFile.length >= 3 && searchStr.includes(normFile)) ||
            normQr.includes(searchStr)
          ) {
            tool = t
            break
          }
        }
      }
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
      editSessionToken: null
    })
  } catch (error) {
    console.error('[SCAN] ❌ Error:', error.message)
    return Response.json({
      error: 'Database error',
      details: error.message
    }, { status: 500 })
  }
}
