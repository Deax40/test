import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrateur',
      email: 'admin@example.com',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('admin123', 10),
    }
  })

  const techUser = await prisma.user.upsert({
    where: { username: 'tech' },
    update: {},
    create: {
      username: 'tech',
      name: 'Technicien Démo',
      email: 'tech@example.com',
      role: 'TECH',
      passwordHash: await bcrypt.hash('tech123', 10),
    }
  })

  console.log('Seed completed:', { adminUser: adminUser.username, techUser: techUser.username })
}

main().catch(e=>{
  console.error(e)
  process.exit(1)
}).finally(async ()=>{
  await prisma.$disconnect()
})
