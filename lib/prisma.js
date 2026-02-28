import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Lazy initialization function
function getPrismaClient() {
  if (!globalForPrisma.prismaInstance) {
    globalForPrisma.prismaInstance = new PrismaClient({
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

    // Pre-connect to avoid cold start failure on first query
    globalForPrisma.prismaInstance.$connect().catch(err => {
      console.error('[PRISMA] Pre-connect failed:', err.message)
    })

    // Graceful shutdown
    if (process.env.NODE_ENV === 'production') {
      process.on('beforeExit', async () => {
        await globalForPrisma.prismaInstance.$disconnect()
      })
    }
  }
  return globalForPrisma.prismaInstance
}

// Export a proxy that creates Prisma on first use
export const prisma = new Proxy({}, {
  get(target, prop) {
    const client = getPrismaClient()
    const value = client[prop]
    // Bind functions to the correct context
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})
