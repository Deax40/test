import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const id = params.id
  const hab = await prisma.habilitation.findUnique({
    where: { id },
    include: { user: { select: { username: true } } }
  })
  if (!hab) return new Response('Not found', { status: 404 })

  if (session.user.role !== 'ADMIN' && hab.user.username !== session.user.username) {
    return new Response('Forbidden', { status: 403 })
  }

  const fileOnDisk = path.isAbsolute(hab.filePath)
    ? hab.filePath
    : path.join(process.cwd(), 'public', hab.filePath)

  try {
    const data = await fs.readFile(fileOnDisk)
    const headers = new Headers()
    const isPdf = fileOnDisk.endsWith('.pdf')
    headers.set('Content-Type', isPdf ? 'application/pdf' : 'application/octet-stream')
    headers.set('Content-Disposition', `inline; filename="${path.basename(fileOnDisk)}"`)
    return new Response(data, { headers })
  } catch {
    return new Response('File not found', { status: 404 })
  }
}
