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

  const communTools = [
    'testeur isolement Iso-tech Gleize',
    'Vernis 30 cm Gleize',
    'Visseuse electronique a choc Gleize',
    'Visseuse pneumatique Gleize',
    'Visseuse pneumatique Paris',
    'pince a sertir Europam 67 Gleize',
    'pince a sertir cosses 10-35',
    'Pompe Enerpac',
    'Rallonge micrometre interieur controle fourreau',
    'Regle de niveau jeu 1 Gleize',
    'Regle de niveau jeu 2 Gleize',
    'Micrometre exterieur vis',
    'Micrometre interieur controle fourreau (diam 90-100)',
    'Niveau a cadre Gleize',
    'Outil Demontage Ecrou Colonne D10',
    'Pince a cercler les joints Gleize',
    'Pince a cercler les joints Paris',
    'Kit changement codeur Baumuller Gleize',
    'Kit change accu',
    'Kit de reparation standard',
    'Kit harnais + casque Gleize',
    'Micrometre 3 touches diam 20-50 Paris',
    'Micrometre exterieur vis 2',
    'Douilles visseuse Gleize',
    'Extracteur Hydraulique Paris',
    'Jeu de Tournevix (Outil de demontage joint) Paris',
    'Jeu de cle a ergots',
    'jeux demontage vis a billes Gleize',
    'jeux demontage vis a billes Paris',
    'Cle hydraulique',
    'cle dynamometrique Gleize',
    'Extracteur a choc',
    'cle plate diam 70 Gleize',
    'comparateur interieur pour controle fourreau',
    'Crichet hydraulique 4 Tonnes',
    'Cle Demontage Ecrou injection 199',
    'Cle Demontage Ecrou injection 213',
    'Cle Demontage Ecrou injection 271',
    'Cle Demontage Ecrou injection 320',
    'Cle Demontage Ecrou injection 360',
    "Camera d'inspection Gleize",
    "Camera d'inspection Paris",
    'Capteur pression Gleize',
    'clef serre tube Gleize',
    'Cle Demontage Ecrou injection 155',
    'Cle Demontage Ecrou injection 180'
  ]

  await prisma.tool.createMany({
    data: [
      ...careTools.map(name => ({ name, category: 'CARE', qrData: name })),
      ...communTools.map(name => ({ name, category: 'COMMUN', qrData: name }))
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
