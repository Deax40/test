import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db.js';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/tokens.js';

async function resolveReadableCookies() {
  try {
    const storeOrPromise = cookies();
    if (storeOrPromise && typeof storeOrPromise.then === 'function') {
      const awaitedStore = await storeOrPromise;
      if (awaitedStore && typeof awaitedStore.get === 'function') {
        return awaitedStore;
      }
    }
    if (storeOrPromise && typeof storeOrPromise.get === 'function') {
      return storeOrPromise;
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      (error.digest === 'DYNAMIC_SERVER_USAGE' ||
        (typeof error.message === 'string' && error.message.includes('because it used `cookies`')))
    ) {
      throw error;
    }
    console.error('lib/session: unable to resolve cookies helper', error);
  }
  return null;
}

export async function getSession() {
  const cookieStore = await resolveReadableCookies();
  if (!cookieStore) {
    return null;
  }
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.sub) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
  };
}

export async function requireUser(allowedRoles) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/logging');
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      redirect('/common');
    }
  }

  return session.user;
}

export async function getSessionPayloadFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
