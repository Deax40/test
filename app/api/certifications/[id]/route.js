import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req, { params }) {
  const cert = await prisma.certification.findUnique({ where: { id: params.id } })
  if (!cert) return new Response('Not found', { status: 404 })
  return new Response(cert.file, {
    headers: { 'Content-Type': cert.fileType }
  })
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  await prisma.certification.delete({ where: { id: params.id } })
  return Response.json({ ok: true })
}
