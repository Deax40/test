import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/tokens.js';

const PAGE_RULES = [
  { pattern: /^\/$/, roles: ['ADMIN', 'TECH'] },
  { pattern: /^\/scan(\/|$)/, roles: ['ADMIN', 'TECH'] },
  { pattern: /^\/common(\/|$)/, roles: ['ADMIN', 'TECH'] },
  { pattern: /^\/profile(\/|$)/, roles: ['ADMIN', 'TECH'] },
  { pattern: /^\/admin(\/|$)/, roles: ['ADMIN'] },
];

const API_RULES = [/^\/api\/tools(\/|$)/];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  if (pathname === '/logging') {
    return NextResponse.next();
  }

  const pageRule = PAGE_RULES.find((rule) => rule.pattern.test(pathname));
  const isApiProtected = API_RULES.some((pattern) => pattern.test(pathname));

  if (!pageRule && !isApiProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    if (isApiProtected) {
      return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
    }
    const loginUrl = new URL('/logging', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (pageRule && !pageRule.roles.includes(payload.role)) {
    const redirectUrl = new URL('/common', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (isApiProtected && !['ADMIN', 'TECH'].includes(payload.role)) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/scan/:path*', '/common/:path*', '/profile/:path*', '/admin/:path*', '/api/tools/:path*'],
};
