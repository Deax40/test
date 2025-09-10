import { prisma } from '../../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  const form = await req.formData()
  const userId = form.get('userId')
  const expiresAtRaw = form.get('expiresAt')
  const file = form.get('file')

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null
  if (!userId || !expiresAtRaw || !file || isNaN(expiresAt)) {
    return new Response('Missing fields', { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${Date.now()}-${file.name}`

  // Try to write inside the public directory so that files can be served
  // statically. When running in serverless environments like Vercel the
  // project directory is read-only and the "public" folder might not be
  // available. In that case we fall back to a temporary directory which is
  // writable at runtime.
  const publicRoot = path.join(process.cwd(), 'public', 'habilitations')
  let dir = path.join(publicRoot, userId)
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (err) {
    console.warn('Falling back to tmp directory for habilitation files', err)
    dir = path.join('/tmp', 'habilitations', userId)
    await fs.mkdir(dir, { recursive: true })
  }
  const filepath = path.join(dir, filename)

  try {
    await fs.writeFile(filepath, buffer)
  } catch (err) {
    console.error('Failed to save file', err)
    return new Response('Failed to save file', { status: 500 })
  }

  const filePathForDb = dir.startsWith(publicRoot)
    ? `/habilitations/${userId}/${filename}`
    : filepath

  const hab = await prisma.habilitation.create({
    data: {
      user: { connect: { id: userId } },
      filePath: filePathForDb,
      expiresAt
    }
  })
  return Response.json({ habilitation: hab })
}
