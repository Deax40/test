import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = new Set([
  '/',
  '/favicon.ico',
  '/engel-logo.svg',
])

function isAuthRoute(pathname) {
  return pathname.startsWith('/api/auth')
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/_next') || pathname.startsWith('/static')
}

async function resolveToken(req) {
  try {
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  } catch (error) {
    console.error('Failed to resolve auth token', error)
    return null
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl

  if (isStaticAsset(pathname) || isAuthRoute(pathname)) {
    return NextResponse.next()
  }

  const token = await resolveToken(req)
  const isApiRoute = pathname.startsWith('/api/')

  if (!token) {
    if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/public')) {
      return NextResponse.next()
    }
    if (isApiRoute) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/scan', req.url))
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    if (isApiRoute) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/scan', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt).*)',
  ],
}
