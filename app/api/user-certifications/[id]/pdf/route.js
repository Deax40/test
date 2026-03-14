import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  try {
    const cert = await prisma.userCertification.findUnique({
      where: { id: params.id },
      select: { pdfBuffer: true, pdfType: true }
    })

    if (!cert || !cert.pdfBuffer) {
      return new Response('PDF not found', { status: 404 })
    }

    const pdfBuffer = Buffer.isBuffer(cert.pdfBuffer)
      ? cert.pdfBuffer
      : Buffer.from(cert.pdfBuffer)

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': cert.pdfType || 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('[USER-CERT PDF] Error:', error)
    return new Response('Server error', { status: 500 })
  }
}
