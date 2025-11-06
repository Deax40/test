import { prisma } from '@/lib/prisma'

export async function GET(req, { params }) {
  try {
    const normalized = String(params.hash || '').trim().toUpperCase()

    const tool = await prisma.tool.findUnique({
      where: { hash: normalized },
      select: {
        problemPhotoBuffer: true,
        problemPhotoType: true
      }
    })

    if (!tool || !tool.problemPhotoBuffer) {
      return new Response('Photo not found', { status: 404 })
    }

    // Convert Buffer to usable format
    const photoBuffer = Buffer.isBuffer(tool.problemPhotoBuffer)
      ? tool.problemPhotoBuffer
      : Buffer.from(tool.problemPhotoBuffer)

    return new Response(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': tool.problemPhotoType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      }
    })
  } catch (error) {
    console.error('[PHOTO] Error:', error)
    return new Response('Server error', { status: 500 })
  }
}
