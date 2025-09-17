'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db.js';
import { hashPassword, isPasswordStrong, verifyPassword } from '@/lib/passwords.js';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken } from '@/lib/tokens.js';

function normalizeEmail(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

export async function loginAction(_prevState, formData) {
  const emailInput = normalizeEmail(formData.get('email'));
  const password = formData.get('password');
  const callbackUrl = typeof formData.get('callbackUrl') === 'string' ? formData.get('callbackUrl') : '/';

  if (!emailInput || typeof password !== 'string' || password.length === 0) {
    return { status: 'error', message: 'Email et mot de passe sont requis.' };
  }

  const user = await prisma.user.findUnique({ where: { email: emailInput } });
  if (!user) {
    return { status: 'error', message: 'Identifiants invalides.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { status: 'error', message: 'Identifiants invalides.' };
  }

  const token = await createSessionToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });

  const safeRedirect = typeof callbackUrl === 'string' && callbackUrl.startsWith('/') ? callbackUrl : '/';
  if (safeRedirect === '/logging') {
    redirect('/');
  }
  redirect(safeRedirect || '/');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  redirect('/logging');
}

export async function createUser({ email, password, role, name }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('Email requis');
  }
  if (!isPasswordStrong(password)) {
    throw new Error('Le mot de passe ne respecte pas la politique de sécurité.');
  }

  const hash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hash,
      role,
      name: name || null,
    },
  });
}
