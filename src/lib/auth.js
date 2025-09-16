import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const usersFile = path.join(process.cwd(), 'data', 'users.json');
const SESSION_COOKIE = 'tool-tracker-session';

async function readUsers() {
  const content = await fs.readFile(usersFile, 'utf8');
  return JSON.parse(content);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function authenticate(email, password) {
  const users = await readUsers();
  const passwordHash = hashPassword(password);
  const user = users.find((item) => item.email === email && item.passwordHash === passwordHash);

  if (!user) {
    return null;
  }

  return { email: user.email, role: user.role, name: user.name ?? null };
}

export async function login(email, password) {
  const user = await authenticate(email, password);

  if (!user) {
    return null;
  }

  const cookieStore = cookies();

  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 heures
  });

  return user;
}

export function logout() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSession() {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw.value);
  } catch (error) {
    console.error('Session invalide', error);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }
}

export function requireRole(allowedRoles) {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect('/unauthorized');
  }

  return session;
}
