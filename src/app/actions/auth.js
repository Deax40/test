'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db';
import { SESSION_COOKIE_NAME, encodeSession } from '@/lib/auth';

export async function login(prevState, formData) {
  const email = formData.get('email');

  if (typeof email !== 'string' || email.trim().length === 0) {
    return { error: 'Merci de renseigner une adresse e-mail.' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { error: 'Utilisateur introuvable. Contactez un administrateur.' };
  }

  const session = { userId: user.id, role: user.role };
  cookies().set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 jours
  });

  redirect('/common');
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/');
}
