import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CARE_TOOLS_DIR = path.join(process.cwd(), 'Care Tools')
const COMMUN_TOOLS_DIR = path.join(process.cwd(), 'Commun Tools')

function getFileInfo(filePath, category) {
  try {
    const stats = fs.statSync(filePath)
    const fileName = path.basename(filePath)
    const ext = path.extname(fileName)
    const nameWithoutExt = path.basename(fileName, ext)

    // Determine location from filename
    let location = 'Non spécifié'
    if (nameWithoutExt.toLowerCase().includes('paris')) {
      location = 'Paris'
    } else if (nameWithoutExt.toLowerCase().includes('gleizé') || nameWithoutExt.toLowerCase().includes('gleiże')) {
      location = 'Gleizé'
    } else if (nameWithoutExt.toLowerCase().includes('tanger')) {
      location = 'Tanger'
    } else if (nameWithoutExt.toLowerCase().includes('tunisie')) {
      location = 'Tunisie'
    }

    // Determine equipment type
    let equipmentType = 'Équipement général'
    const lowerName = nameWithoutExt.toLowerCase()
    if (lowerName.includes('camera') || lowerName.includes('caméra')) {
      equipmentType = 'Équipement d\'inspection'
    } else if (lowerName.includes('four') || lowerName.includes('chauffe')) {
      equipmentType = 'Équipement de chauffage'
    } else if (lowerName.includes('pression') || lowerName.includes('capteur')) {
      equipmentType = 'Équipement de mesure'
    } else if (lowerName.includes('clé') || lowerName.includes('cle') || lowerName.includes('visseuse')) {
      equipmentType = 'Outil mécanique'
    } else if (lowerName.includes('micromètre') || lowerName.includes('micrometre')) {
      equipmentType = 'Instrument de mesure'
    } else if (lowerName.includes('care')) {
      equipmentType = 'Équipement de maintenance'
    }

    // Generate hash from filename
    const hash = crypto.createHash('md5').update(fileName).digest('hex').substring(0, 8).toUpperCase()

    return {
      fileName,
      filePath,
      category,
      equipmentType,
      location,
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      format: ext === '.bs' ? 'Badge Studio (.bs)' : ext,
      extension: ext,
      hash,
      uuid: 'Non disponible'
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    return null
  }
}

export function getAllFileInfo() {
  const allFiles = []

  // Process Care Tools
  try {
    if (fs.existsSync(CARE_TOOLS_DIR)) {
      const careFiles = fs.readdirSync(CARE_TOOLS_DIR)
      for (const file of careFiles) {
        if (path.extname(file) === '.bs') {
          const filePath = path.join(CARE_TOOLS_DIR, file)
          const info = getFileInfo(filePath, 'Care Tools')
          if (info) {
            allFiles.push(info)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading Care Tools directory:', error)
  }

  // Process Commun Tools
  try {
    if (fs.existsSync(COMMUN_TOOLS_DIR)) {
      const communFiles = fs.readdirSync(COMMUN_TOOLS_DIR)
      for (const file of communFiles) {
        if (path.extname(file) === '.bs') {
          const filePath = path.join(COMMUN_TOOLS_DIR, file)
          const info = getFileInfo(filePath, 'Commun Tools')
          if (info) {
            allFiles.push(info)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading Commun Tools directory:', error)
  }

  return allFiles.sort((a, b) => a.fileName.localeCompare(b.fileName))
}

export function getFileStats() {
  const files = getAllFileInfo()
  const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0)
  const careFiles = files.filter(f => f.category === 'Care Tools')
  const communFiles = files.filter(f => f.category === 'Commun Tools')

  return {
    totalFiles: files.length,
    careFiles: careFiles.length,
    communFiles: communFiles.length,
    totalSize: Math.round(totalSize / 1024), // in KB
    locations: [...new Set(files.map(f => f.location))],
    equipmentTypes: [...new Set(files.map(f => f.equipmentType))]
  }
}