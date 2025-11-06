import { prisma } from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const certId = params.id

    const cert = await prisma.certification.findUnique({
      where: { id: certId },
      select: {
        pdfBuffer: true,
        pdfType: true
      }
    })

    if (!cert || !cert.pdfBuffer) {
      return new Response('PDF not found', { status: 404 })
    }

    // Convert Buffer to usable format
    const pdfBuffer = Buffer.isBuffer(cert.pdfBuffer)
      ? cert.pdfBuffer
      : Buffer.from(cert.pdfBuffer)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': cert.pdfType || 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      }
    })
  } catch (error) {
    console.error('[CERT PDF] Error:', error)
    return new Response('Server error', { status: 500 })
  }
}
