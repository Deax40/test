import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/'
  }
})

export const config = {
  matcher: [
    '/care/:path*',
    '/commun/:path*',
    '/scan/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/compte/:path*',
    '/api/care/:path*',
    '/api/commun/:path*',
    '/api/scan/:path*',
    '/api/commons/:path*',
    '/api/habilitations/:path*',
    '/api/certifications/:path*',
    '/api/machine-revisions/:path*',
    '/api/scan-history/:path*',
    '/api/user/:path*',
    '/api/account/:path*',
    '/api/admin/:path*',
  ]
}
