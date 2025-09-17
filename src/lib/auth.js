import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

import { prisma } from './db.js';

const SESSION_COOKIE_NAME = 'toolbox_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

const scryptAsync = promisify(scrypt);

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function authenticateUser(email, password) {
  const cleanedEmail = sanitizeString(email).toLowerCase();
  const cleanedPassword = sanitizeString(password);
  if (!cleanedEmail || !cleanedPassword) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanedEmail },
  });

  if (!user) {
    return null;
  }

  const isValid = await verifyPasswordAgainstHash(cleanedPassword, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function persistSession(userId) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function createUserSession(userId) {
  await persistSession(userId);
}

async function removeSessionByToken(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function destroyCurrentSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    await removeSessionByToken(token);
  }
}

async function fetchSessionFromRequest() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    cookies().delete(SESSION_COOKIE_NAME);
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await fetchSessionFromRequest();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/logging');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    redirect('/');
  }
  return user;
}

export function isAdmin(user) {
  return user?.role === 'ADMIN';
}

export function sanitizePassword(value) {
  return sanitizeString(value);
}

export async function verifyUserPassword(userId, password) {
  const cleanedPassword = sanitizePassword(password);
  if (!cleanedPassword) return false;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return verifyPasswordAgainstHash(cleanedPassword, user.passwordHash);
}

export async function updateUserPassword(userId, newPassword) {
  const cleanedPassword = sanitizePassword(newPassword);
  if (!cleanedPassword) {
    throw new Error('Le mot de passe est obligatoire');
  }
  const passwordHash = await hashPassword(cleanedPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${Buffer.from(derivedKey).toString('base64')}`;
}

async function verifyPasswordAgainstHash(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const salt = Buffer.from(parts[1], 'base64');
  const storedKey = Buffer.from(parts[2], 'base64');
  const derivedKey = await scryptAsync(password, salt, storedKey.length);

  try {
    return timingSafeEqual(storedKey, derivedKey);
  } catch (error) {
    return false;
  }
}
