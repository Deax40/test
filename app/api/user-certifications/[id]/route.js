import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const formData = await req.formData()
    const title = formData.get('title')
    const revisionDateStr = formData.get('revisionDate')
    const notes = formData.get('notes')
    const pdfFile = formData.get('pdfFile')

    const updateData = {}
    if (title) updateData.title = title
    if (revisionDateStr) {
      const revisionDate = new Date(revisionDateStr)
      if (!isNaN(revisionDate.getTime())) updateData.revisionDate = revisionDate
    }
    if (notes !== null) updateData.notes = notes

    if (pdfFile && pdfFile.size > 0) {
      if (pdfFile.type !== 'application/pdf') {
        return new Response('Only PDF files are allowed', { status: 400 })
      }
      if (pdfFile.size > 4 * 1024 * 1024) {
        return new Response('PDF trop volumineux (max 4MB)', { status: 400 })
      }
      const bytes = await pdfFile.arrayBuffer()
      updateData.pdfBuffer = Buffer.from(bytes)
      updateData.pdfType = pdfFile.type
    }

    const certification = await prisma.userCertification.update({
      where: { id: params.id },
      data: updateData
    })

    return Response.json({ certification })
  } catch (e) {
    console.error('[USER-CERT] Error updating certification:', e)
    return new Response('Server error', { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await prisma.userCertification.delete({ where: { id: params.id } })
    return Response.json({ success: true })
  } catch (e) {
    console.error('[USER-CERT] Error deleting certification:', e)
    return new Response('Server error', { status: 500 })
  }
}
