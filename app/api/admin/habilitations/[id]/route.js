import { prisma } from '../../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }
  const id = params.id
  const hab = await prisma.habilitation.findUnique({ where: { id } })
  if (!hab) return new Response('Not found', { status: 404 })
  await prisma.habilitation.delete({ where: { id } })
  try {
    // Stored paths are usually relative to the public directory so that files
    // can be served statically. If an absolute path is stored (e.g. when
    // falling back to the temporary directory in serverless environments),
    // use it directly.
    const fileOnDisk = path.isAbsolute(hab.filePath)
      ? hab.filePath
      : path.join(process.cwd(), 'public', hab.filePath)
    await fs.unlink(fileOnDisk)
  } catch {}
  return Response.json({ ok: true })
}
