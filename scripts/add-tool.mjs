import { PrismaClient } from '@prisma/client'
import { COMMUN_TOOLS } from '../lib/commun-tools.js'

const prisma = new PrismaClient()

async function main() {
  const sample = COMMUN_TOOLS.find(t => t.name === 'Visseuse pneumatique Paris')
  if (!sample) throw new Error('Tool not found in list')
  const tool = await prisma.tool.create({
    data: {
      name: sample.name,
      category: 'COMMUN',
      hash: sample.hash,
      qrData: sample.hash
    }
  })
  console.log('Tool inserted:', tool)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
