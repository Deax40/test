import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { refreshToolsFromFiles } from '@/lib/care-data'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const category = formData.get('category') // "CARE" ou "COMMUN"

    if (!file) {
      return new Response(JSON.stringify({ error: 'Aucun fichier fourni' }), { status: 400 })
    }

    if (!file.name.endsWith('.bs')) {
      return new Response(JSON.stringify({ error: 'Le fichier doit être au format .bs' }), { status: 400 })
    }

    // Extraire les métadonnées du nom de fichier
    // Format attendu: "NOM_EMPLACEMENT_TYPE.bs"
    const fileNameWithoutExt = file.name.replace('.bs', '')
    const parts = fileNameWithoutExt.split('_')

    let name = parts[0] || fileNameWithoutExt
    let location = parts[1] || 'Non spécifié'
    let equipmentType = parts[2] || 'Non spécifié'

    // Si le fichier a un format différent, utiliser le nom complet
    if (parts.length < 2) {
      name = fileNameWithoutExt
      location = 'Non spécifié'
      equipmentType = 'Non spécifié'
    }

    // Générer le hash du nom de fichier pour le QR code
    // Pour Care: utiliser MD5 comme dans care-data.js (8 caractères uppercase)
    // Pour Commun: utiliser lowercase hash
    let hash
    if (category === 'CARE') {
      hash = crypto.createHash('md5').update(file.name).digest('hex').substring(0, 8).toUpperCase()
    } else {
      hash = crypto.createHash('md5').update(file.name).digest('hex').substring(0, 8).toLowerCase()
    }

    // Vérifier si l'outil existe déjà dans la base de données
    const existingTool = await prisma.tool.findUnique({
      where: { hash: hash }
    })

    if (existingTool) {
      return new Response(JSON.stringify({
        error: 'Cet outil existe déjà dans la base de données',
        hash: hash,
        name: existingTool.name
      }), { status: 409 })
    }

    // Vérifier si le fichier existe déjà
    const existingFile = await prisma.adminFileInfo.findFirst({
      where: { hash: hash }
    })

    if (existingFile) {
      return new Response(JSON.stringify({
        error: 'Ce fichier existe déjà dans la base de données',
        hash: hash,
        fileName: existingFile.fileName
      }), { status: 409 })
    }

    // Déterminer le dossier de destination
    const folderName = category === 'CARE' ? 'Care Tools' : 'Commun Tools'
    const targetDir = join(process.cwd(), folderName)

    // Créer le dossier s'il n'existe pas
    await mkdir(targetDir, { recursive: true })

    // Sauvegarder le fichier
    const filePath = join(targetDir, file.name)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Générer un UUID
    const uuid = crypto.randomUUID()

    // Créer l'entrée dans AdminFileInfo
    await prisma.adminFileInfo.create({
      data: {
        fileName: file.name,
        filePath: filePath,
        category: folderName,
        equipmentType: equipmentType,
        location: location,
        fileSize: buffer.length,
        format: 'Badge Studio',
        extension: '.bs',
        hash: hash,
        uuid: uuid
      }
    })

    // Si c'est un outil CARE, créer également l'entrée dans la table Tool
    if (category === 'CARE') {
      await prisma.tool.create({
        data: {
          name: name,
          category: 'CARE',
          hash: hash,
          qrData: `CARE_${hash}`,
          fileName: file.name,
          filePath: filePath,
          fileSize: buffer.length,
          fileExtension: '.bs',
          lastScanEtat: 'RAS'
        }
      })

      // Rafraîchir les outils Care depuis les fichiers pour mettre à jour le cache (dev only)
      if (!process.env.VERCEL) {
        refreshToolsFromFiles()
      }
    } else {
      // Pour COMMUN, créer aussi dans la table Tool avec les champs appropriés
      await prisma.tool.create({
        data: {
          name: name,
          category: 'COMMUN',
          hash: hash,
          qrData: `COMMUN_${hash}`,
          fileName: file.name,
          filePath: filePath,
          fileSize: buffer.length,
          fileExtension: '.bs',
          lastScanEtat: 'RAS'
        }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Outil ajouté avec succès et prêt à être scanné',
      hash: hash,
      name: name,
      category: category
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error uploading tool:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'upload du fichier',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
