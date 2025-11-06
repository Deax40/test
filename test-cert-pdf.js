import { PrismaClient } from '@prisma/client'
import fs from 'fs'

// Load environment variables
const envPath = '.env.vercel'
const envContent = fs.readFileSync(envPath, 'utf8')
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length > 0) {
    process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

const prisma = new PrismaClient()

async function testCertPDF() {
  try {
    console.log('🔍 Checking certifications...')

    // Get all certifications
    const certs = await prisma.certification.findMany({
      select: {
        id: true,
        toolName: true,
        toolCategory: true,
        revisionDate: true,
        pdfBuffer: true,
        pdfType: true,
        pdfPath: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`\n📊 Found ${certs.length} certifications\n`)

    certs.forEach((cert, idx) => {
      console.log(`${idx + 1}. ${cert.toolName} (${cert.toolCategory})`)
      console.log(`   ID: ${cert.id}`)
      console.log(`   Revision Date: ${cert.revisionDate.toLocaleDateString('fr-FR')}`)
      console.log(`   Has pdfBuffer: ${!!cert.pdfBuffer} ${cert.pdfBuffer ? `(${cert.pdfBuffer.length} bytes)` : ''}`)
      console.log(`   PDF Type: ${cert.pdfType || 'N/A'}`)
      console.log(`   PDF Path (legacy): ${cert.pdfPath || 'N/A'}`)
      console.log(`   Created: ${cert.createdAt.toLocaleDateString('fr-FR')}`)
      console.log('')
    })

    // Test if we can read a PDF buffer
    const certWithPDF = certs.find(c => c.pdfBuffer)
    if (certWithPDF) {
      console.log(`✅ Found certification with PDF: ${certWithPDF.toolName}`)
      console.log(`   PDF size: ${certWithPDF.pdfBuffer.length} bytes`)
      console.log(`   PDF type: ${certWithPDF.pdfType}`)

      // Check if it's a valid PDF header
      const header = certWithPDF.pdfBuffer.slice(0, 4).toString()
      console.log(`   PDF header: ${header}`)
      console.log(`   Valid PDF: ${header === '%PDF'}`)
    } else {
      console.log('⚠️  No certifications with PDF found in database')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testCertPDF()
