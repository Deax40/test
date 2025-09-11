import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tool = await prisma.tool.create({
    data: {
      name: 'Visseuse pneumatique Paris',
      category: 'COMMUN',
      qrData: 'Visseuse pneumatique Paris'
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
