import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Enhanced Prisma client with detailed logging
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'error', 'warn'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ [PRISMA] Database connected successfully')
  })
  .catch((error) => {
    console.error('❌ [PRISMA] Database connection failed:', error.message)
    console.error('[PRISMA] DATABASE_URL configured:', !!process.env.DATABASE_URL)
  })
