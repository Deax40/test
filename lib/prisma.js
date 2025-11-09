import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

let prismaInstance = null

// Lazy initialization function
function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })

    // Add middleware
    prismaInstance.$use(async (params, next) => {
      const before = Date.now()
      const result = await next(params)
      const after = Date.now()
      console.log(`[PRISMA] ${params.model}.${params.action} took ${after - before}ms`)
      return result
    })

    // Graceful shutdown
    if (process.env.NODE_ENV === 'production') {
      process.on('beforeExit', async () => {
        await prismaInstance.$disconnect()
      })
    }
  }
  return prismaInstance
}

// Export a proxy that creates Prisma on first use
export const prisma = new Proxy({}, {
  get(target, prop) {
    return getPrismaClient()[prop]
  }
})
