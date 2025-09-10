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
  const dir = path.join(process.cwd(), 'public', 'habilitations', userId)
  await fs.mkdir(dir, { recursive: true })
  const filepath = path.join(dir, filename)

  try {
    await fs.writeFile(filepath, buffer)
  } catch (err) {
    console.error('Failed to save file', err)
    return new Response('Failed to save file', { status: 500 })
  }

  const hab = await prisma.habilitation.create({
    data: {
      user: { connect: { id: userId } },
      filePath: `/habilitations/${userId}/${filename}`,
      expiresAt
    }
  })
  return Response.json({ habilitation: hab })
}
