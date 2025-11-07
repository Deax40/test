import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Skip Prisma initialization during Next.js build to avoid DB connection errors
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

// Prisma client optimized for Vercel serverless
export const prisma = isBuild
  ? null
  : (globalForPrisma.prisma || new PrismaClient({
      // IMPORTANT: Enable detailed logs even in production for debugging on Vercel
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'pretty',
      // Connection pool optimization for serverless
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }))

// Reuse Prisma client in development (hot reload)
if (process.env.NODE_ENV !== 'production' && !isBuild) {
  globalForPrisma.prisma = prisma
}

// IMPORTANT: Do NOT call $connect() at module level
// Let Prisma manage connections automatically for serverless
// Vercel functions are stateless and may be frozen/unfrozen

// Add connection middleware for debugging (only if not building)
if (!isBuild && prisma) {
  prisma.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()

    console.log(`[PRISMA] ${params.model}.${params.action} took ${after - before}ms`)

    return result
  })
}

// Graceful shutdown handler
if (process.env.NODE_ENV === 'production' && !isBuild && prisma) {
  // Add handlers for Vercel serverless cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
