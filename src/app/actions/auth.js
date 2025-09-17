'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db.js';
import {
  authenticateUser,
  createUserSession,
  destroyCurrentSession,
  requireUser,
  updateUserPassword,
  verifyUserPassword,
} from '@/lib/auth.js';

function cleanInput(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function resolveRedirectPath(value) {
  const cleaned = cleanInput(value);
  if (!cleaned.startsWith('/')) return '/';
  if (cleaned.startsWith('//')) return '/';
  return cleaned;
}

export async function signInAction(formData) {
  const email = cleanInput(formData.get('email'));
  const password = cleanInput(formData.get('password'));
  const redirectTo = resolveRedirectPath(formData.get('redirectTo') ?? '/');

  const user = await authenticateUser(email, password);
  if (!user) {
    redirect('/logging?error=invalid-credentials');
  }

  await createUserSession(user.id);
  redirect(redirectTo || '/');
}

export async function signOutAction() {
  await destroyCurrentSession();
  redirect('/logging');
}

export async function updateProfileAction(formData) {
  const user = await requireUser();
  const name = cleanInput(formData.get('name')) || null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
    },
  });

  revalidatePath('/account');
  revalidatePath('/');
  redirect('/account?status=profile-updated');
}

export async function changePasswordAction(formData) {
  const user = await requireUser();
  const currentPassword = cleanInput(formData.get('currentPassword'));
  const newPassword = cleanInput(formData.get('newPassword'));
  const confirmPassword = cleanInput(formData.get('confirmPassword'));

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect('/account?error=missing-fields');
  }

  if (newPassword.length < 8) {
    redirect('/account?error=password-too-short');
  }

  if (newPassword !== confirmPassword) {
    redirect('/account?error=password-mismatch');
  }

  const isValid = await verifyUserPassword(user.id, currentPassword);
  if (!isValid) {
    redirect('/account?error=invalid-current-password');
  }

  await updateUserPassword(user.id, newPassword);
  revalidatePath('/account');
  redirect('/account?status=password-updated');
}
