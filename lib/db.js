import { PrismaClient } from '@prisma/client';

// Évite de recréer le client en dev (HMR)
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
