import { PrismaClient } from '@prisma/client'
import { NAME_TO_HASH } from '../lib/toolHashes.js'

const prisma = new PrismaClient()

async function main() {
  for (const [name, hash] of Object.entries(NAME_TO_HASH)) {
    await prisma.tool.updateMany({
      where: { name },
      data: { hash, qrData: hash }
    })
  }
  await prisma.$executeRawUnsafe('UPDATE "Tool" SET "hash" = "name", "qrData" = "name" WHERE "hash" IS NULL')
  console.log('Hash backfill completed')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
