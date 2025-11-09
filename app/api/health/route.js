import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Health check endpoint for Vercel deployment
 * Tests database connectivity, read/write operations
 *
 * Usage: GET /api/health
 */
export async function GET(request) {
  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    status: 'checking',
    checks: {},
    duration: 0,
  }

  console.log('[HEALTH] ====== HEALTH CHECK START ======')

  // 1. Check environment variables
  console.log('[HEALTH] Checking environment variables...')
  results.checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + '...',
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  }

  if (!process.env.DATABASE_URL) {
    console.error('[HEALTH] ❌ DATABASE_URL not configured')
    results.status = 'error'
    results.error = 'DATABASE_URL not configured'
    results.duration = Date.now() - startTime
    return Response.json(results, { status: 500 })
  }

  // 2. Test Prisma connection
  console.log('[HEALTH] Testing Prisma connection...')
  try {
    await prisma.$connect()
    console.log('[HEALTH] ✅ Prisma connected')
    results.checks.prismaConnection = { status: 'connected' }
  } catch (error) {
    console.error('[HEALTH] ❌ Prisma connection failed:', error.message)
    results.checks.prismaConnection = {
      status: 'error',
      error: error.message
    }
    results.status = 'error'
    results.duration = Date.now() - startTime
    return Response.json(results, { status: 500 })
  }

  // 3. Test database read (count tools)
  console.log('[HEALTH] Testing database read...')
  try {
    const toolCount = await prisma.tool.count()
    console.log('[HEALTH] ✅ Database read successful, tools:', toolCount)
    results.checks.databaseRead = {
      status: 'ok',
      toolCount
    }
  } catch (error) {
    console.error('[HEALTH] ❌ Database read failed:', error.message)
    results.checks.databaseRead = {
      status: 'error',
      error: error.message
    }
    results.status = 'error'
  }

  // 4. Test database write (upsert a test tool)
  console.log('[HEALTH] Testing database write...')
  try {
    const testHash = 'HEALTH_CHECK_TEST'
    const testTool = await prisma.tool.upsert({
      where: { hash: testHash },
      update: {
        lastScanAt: new Date(),
        lastScanUser: 'health-check',
      },
      create: {
        hash: testHash,
        name: 'Health Check Test Tool',
        category: 'System',
        qrData: 'HEALTH_CHECK',
        lastScanAt: new Date(),
        lastScanUser: 'health-check',
      },
    })
    console.log('[HEALTH] ✅ Database write successful, tool ID:', testTool.id)
    results.checks.databaseWrite = {
      status: 'ok',
      testToolId: testTool.id
    }
  } catch (error) {
    console.error('[HEALTH] ❌ Database write failed:', error.message)
    results.checks.databaseWrite = {
      status: 'error',
      error: error.message,
      code: error.code,
    }
    results.status = 'error'
  }

  // 5. Final status
  const allPassed = Object.values(results.checks).every(
    check => check.status === 'ok' || check.status === 'connected'
  )

  if (allPassed) {
    results.status = 'healthy'
    console.log('[HEALTH] ✅ All checks passed')
  } else {
    results.status = 'degraded'
    console.log('[HEALTH] ⚠️ Some checks failed')
  }

  results.duration = Date.now() - startTime
  console.log('[HEALTH] ====== HEALTH CHECK COMPLETE in', results.duration, 'ms ======')

  const httpStatus = results.status === 'healthy' ? 200 : 500

  return Response.json(results, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}
