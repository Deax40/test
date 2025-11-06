import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

async function testPDFUpload() {
  try {
    console.log('🧪 Testing PDF upload to database...')

    // Create a small test PDF (just the header for testing)
    const testPDFContent = Buffer.from('%PDF-1.4\nTest PDF content\n%%EOF')

    const testCert = {
      toolName: 'Test Tool PDF',
      toolCategory: 'COMMUN',
      toolHash: 'test-hash-' + Date.now(),
      revisionDate: new Date(),
      pdfBuffer: testPDFContent,
      pdfType: 'application/pdf'
    }

    console.log('\n📝 Creating test certification with PDF...')
    console.log(`   Tool: ${testCert.toolName}`)
    console.log(`   Category: ${testCert.toolCategory}`)
    console.log(`   PDF size: ${testPDFContent.length} bytes`)

    const created = await prisma.certification.create({
      data: testCert,
      select: {
        id: true,
        toolName: true,
        pdfBuffer: true,
        pdfType: true
      }
    })

    console.log('\n✅ Certification created successfully!')
    console.log(`   ID: ${created.id}`)
    console.log(`   PDF Buffer stored: ${!!created.pdfBuffer}`)
    console.log(`   PDF size: ${created.pdfBuffer?.length || 0} bytes`)
    console.log(`   PDF type: ${created.pdfType}`)

    // Verify we can read it back
    console.log('\n🔍 Verifying we can read the PDF back...')
    const retrieved = await prisma.certification.findUnique({
      where: { id: created.id },
      select: {
        pdfBuffer: true,
        pdfType: true
      }
    })

    if (retrieved.pdfBuffer) {
      const header = retrieved.pdfBuffer.slice(0, 4).toString()
      console.log(`   PDF header: ${header}`)
      console.log(`   Valid PDF header: ${header === '%PDF'}`)
      console.log('\n✅ PDF storage and retrieval WORKING!')
    } else {
      console.log('\n❌ ERROR: PDF was not stored properly!')
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...')
    await prisma.certification.delete({
      where: { id: created.id }
    })
    console.log('✅ Test data cleaned up')

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testPDFUpload()
