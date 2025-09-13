import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { COMMUN_TOOLS } from '../lib/commun-tools.js'

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

  const careTools = [
    'Care Capteur pression matière Silicone 43CH002505',
    'Jeu 1 Care Control Chauffe Paris',
    'Jeu 1 Care Extension de Colonne Paris',
    'Jeu 1 Care Four flucke Paris',
    'Jeu 1 Care Mesure de Pression Paris',
    'Jeu 2 Care Chauffe Paris',
    'Jeu 2 Care Mesure de Pression Paris',
    'Jeu 2 Care Pression matière Paris',
    'Jeu 3 Care Chauffe Gleizé',
    'Jeu 3 Care Extension de Colonne Gleizé',
    'Jeu 3 Care Four flucke Gleizé',
    'Jeu 3 Care Pression matière Gleizé',
    'Jeu 4 Care Chauffe Gleizé',
    'Jeu 4 Care Extension de Colonne Gleizé',
    'Jeu 4 Care Pression matière Gleizé'
  ]

  const communTools = COMMUN_TOOLS

  await prisma.tool.createMany({
    data: [
      ...careTools.map(name => ({ name, category: 'CARE', qrData: name })),
      ...communTools.map(t => ({ name: t.name, category: 'COMMUN', qrData: t.hash }))
    ]
  })

  console.log('Seed completed:', { adminUser: adminUser.username, techUser: techUser.username })
}

main().catch(e=>{
  console.error(e)
  process.exit(1)
}).finally(async ()=>{
  await prisma.$disconnect()
})
