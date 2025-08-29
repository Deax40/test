import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Nom d\'utilisateur', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        const { username, password, role } = credentials
        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return null
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null
        // Only allow sign-in if role matches the user's role requirement
        if (role === 'ADMIN' && user.role !== 'ADMIN') return null
        if (role === 'TECH' && user.role !== 'TECH') return null
        return { id: user.id, name: user.name, username: user.username, role: user.role }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      session.user = session.user || {}
      session.user.role = token.role
      session.user.username = token.username
      return session
    }
  },
  pages: {
    signIn: '/' // default to tech login
  }
}
