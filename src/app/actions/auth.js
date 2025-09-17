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

async function resolveMutableCookies() {
  try {
    const storeOrPromise = cookies();
    if (storeOrPromise && typeof storeOrPromise.then === 'function') {
      const awaitedStore = await storeOrPromise;
      if (awaitedStore && typeof awaitedStore.set === 'function') {
        return awaitedStore;
      }
    }
    if (storeOrPromise && typeof storeOrPromise.set === 'function') {
      return storeOrPromise;
    }
  } catch (error) {
    console.error('actions/auth: unable to resolve cookies helper', error);
  }
  return null;
}

export async function loginAction(_prevState, formData) {
  const emailInput = normalizeEmail(formData.get('email'));
  const password = formData.get('password');
  const callbackUrl = typeof formData.get('callbackUrl') === 'string' ? formData.get('callbackUrl') : '/';

  if (!emailInput || typeof password !== 'string' || password.length === 0) {
    return { status: 'error', message: 'Email et mot de passe sont requis.' };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email: emailInput } });
  } catch (error) {
    console.error('actions/auth: failed to retrieve user', error);
    return { status: 'error', message: 'Une erreur est survenue. Veuillez réessayer plus tard.' };
  }
  if (!user) {
    return { status: 'error', message: 'Identifiants invalides.' };
  }

  let isValid = false;
  try {
    isValid = await verifyPassword(password, user.passwordHash);
  } catch (error) {
    console.error('actions/auth: password verification failed', error);
    return { status: 'error', message: 'Une erreur est survenue. Veuillez réessayer plus tard.' };
  }
  if (!isValid) {
    return { status: 'error', message: 'Identifiants invalides.' };
  }

  let token;
  try {
    token = await createSessionToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
  } catch (error) {
    console.error('actions/auth: failed to create session token', error);
    return { status: 'error', message: 'Une erreur est survenue. Veuillez réessayer plus tard.' };
  }

  const cookieStore = await resolveMutableCookies();
  if (!cookieStore) {
    console.error('actions/auth: cookies helper did not return a mutable store');
    return { status: 'error', message: 'Impossible de créer la session. Contactez un administrateur.' };
  }
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  try {
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires,
    });
  } catch (error) {
    console.error('actions/auth: failed to persist session cookie', error);
    return { status: 'error', message: 'Impossible de créer la session. Veuillez réessayer.' };
  }

  const safeRedirect = typeof callbackUrl === 'string' && callbackUrl.startsWith('/') ? callbackUrl : '/';
  if (safeRedirect === '/logging') {
    redirect('/');
  }
  redirect(safeRedirect || '/');
}

export async function logoutAction() {
  const cookieStore = await resolveMutableCookies();
  if (cookieStore) {
    try {
      if (typeof cookieStore.delete === 'function') {
        cookieStore.delete({ name: SESSION_COOKIE_NAME, path: '/' });
      } else {
        cookieStore.set(SESSION_COOKIE_NAME, '', {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          expires: new Date(0),
        });
      }
    } catch (error) {
      console.error('actions/auth: failed to clear session cookie', error);
    }
  } else {
    console.error('actions/auth: cookies helper unavailable during logout');
  }
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
