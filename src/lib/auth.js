import 'server-only';

import { cookies } from 'next/headers';

import { prisma } from './db';

export const SESSION_COOKIE_NAME = 'app_session';

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  const padding = value.length % 4;
  const normalized =
    padding === 0 ? value : value + '='.repeat(4 - padding);
  const base64 = normalized.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function encodeSession(session) {
  return base64UrlEncode(JSON.stringify(session));
}

function decodeSession(value) {
  return JSON.parse(base64UrlDecode(value));
}

export async function getSession() {
  const cookie = cookies().get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return null;
  }

  try {
    return decodeSession(cookie.value);
  } catch (error) {
    cookies().delete(SESSION_COOKIE_NAME);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: session.userId } });
}

export function formatRole(role) {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'TECH':
      return 'Tech';
    default:
      return role ?? 'Inconnu';
  }
}
