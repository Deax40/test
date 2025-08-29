import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireRole(role) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== role) {
    return null
  }
  return session
}
