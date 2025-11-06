import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.vercel or .env.local
const envFiles = ['.env.vercel', '.env.local', '.env']
let loaded = false
for (const envFile of envFiles) {
  try {
    const envPath = path.join(process.cwd(), envFile)
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=')
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '')
      }
    })
    console.log(`✅ Loaded environment from ${envFile}`)
    loaded = true
    break
  } catch (error) {
    // Try next file
  }
}
if (!loaded) {
  console.log('⚠️  Could not load environment file, using existing environment')
}

const prisma = new PrismaClient()

function extractNameFromFileName(fileName) {
  if (!fileName) return null
  // Remove file extension (.bs, etc)
  return fileName.replace(/\.[^/.]+$/, '')
}

async function fixToolNames() {
  console.log('🔧 Starting tool name fix...')

  try {
    // Find all tools with names starting with "Tool "
    const toolsToFix = await prisma.tool.findMany({
      where: {
        name: {
          startsWith: 'Tool '
        }
      }
    })

    console.log(`Found ${toolsToFix.length} tools with default names`)

    // Get all AdminFileInfo to match by hash
    const adminFileInfos = await prisma.adminFileInfo.findMany()
    console.log(`Found ${adminFileInfos.length} AdminFileInfo entries`)

    // Load data from JSON files
    let communData = null
    let careData = null

    try {
      const communDataPath = path.join(process.cwd(), 'data', 'commun-data.json')
      communData = JSON.parse(fs.readFileSync(communDataPath, 'utf8'))
      console.log(`📦 Loaded ${communData.tools?.length || 0} tools from commun-data.json`)
    } catch (error) {
      console.log('⚠️  Could not load commun-data.json')
    }

    try {
      const careDataPath = path.join(process.cwd(), 'data', 'care-data.json')
      careData = JSON.parse(fs.readFileSync(careDataPath, 'utf8'))
      console.log(`📦 Loaded ${careData.tools?.length || 0} tools from care-data.json`)
    } catch (error) {
      console.log('⚠️  Could not load care-data.json')
    }

    let fixed = 0
    let skipped = 0

    for (const tool of toolsToFix) {
      let realName = null
      let source = ''

      // Try to get name from tool.fileName
      if (tool.fileName) {
        realName = extractNameFromFileName(tool.fileName)
        source = 'tool.fileName'
      }

      // If no fileName in tool, search in AdminFileInfo by hash
      if (!realName) {
        const fileInfo = adminFileInfos.find(info =>
          info.hash === tool.hash ||
          info.hash === tool.hash.toUpperCase() ||
          info.hash === tool.hash.toLowerCase()
        )

        if (fileInfo) {
          realName = extractNameFromFileName(fileInfo.fileName)
          source = 'AdminFileInfo'
        }
      }

      // Search in commun-data.json
      if (!realName && communData) {
        const communTool = communData.tools.find(t =>
          t.hash?.toLowerCase() === tool.hash?.toLowerCase()
        )
        if (communTool && communTool.name) {
          realName = communTool.name
          source = 'commun-data.json'
        }
      }

      // Search in care-data.json
      if (!realName && careData) {
        const careTool = careData.tools.find(t =>
          t.hash?.toLowerCase() === tool.hash?.toLowerCase()
        )
        if (careTool && careTool.name) {
          realName = careTool.name
          source = 'care-data.json'
        }
      }

      if (realName && realName !== tool.name) {
        await prisma.tool.update({
          where: { id: tool.id },
          data: {
            name: realName,
            // Also update fileName if we found it from AdminFileInfo
            ...(tool.fileName ? {} : { fileName: realName + (tool.fileExtension || '') })
          }
        })

        console.log(`✅ Fixed: "${tool.name.substring(0, 50)}..." → "${realName}" (from ${source})`)
        fixed++
      } else {
        console.log(`⚠️  Skipped: ${tool.name.substring(0, 50)}... (no valid name found)`)
        skipped++
      }
    }

    console.log(`\n✨ Done! Fixed ${fixed} tools, skipped ${skipped}`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixToolNames()
