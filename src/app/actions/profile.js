'use server';

import { prisma } from '@/lib/db.js';
import { hashPassword, isPasswordStrong, verifyPassword } from '@/lib/passwords.js';
import { getSession } from '@/lib/session.js';

function getField(formData, key) {
  const value = formData.get(key);
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export async function changePasswordAction(_prevState, formData) {
  const session = await getSession();
  if (!session?.user) {
    return { status: 'error', message: 'Session expirée. Merci de vous reconnecter.' };
  }

  const currentPassword = getField(formData, 'currentPassword');
  const newPassword = getField(formData, 'newPassword');
  const confirmPassword = getField(formData, 'confirmPassword');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { status: 'error', message: 'Tous les champs sont requis.' };
  }

  if (newPassword !== confirmPassword) {
    return { status: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' };
  }

  if (newPassword === currentPassword) {
    return { status: 'error', message: 'Le nouveau mot de passe doit être différent de l\'ancien.' };
  }

  if (!isPasswordStrong(newPassword)) {
    return {
      status: 'error',
      message: 'Le mot de passe doit contenir au minimum 8 caractères, un chiffre et un caractère spécial.',
    };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { status: 'error', message: 'Utilisateur introuvable.' };
  }

  const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return { status: 'error', message: 'Le mot de passe actuel est incorrect.' };
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return { status: 'success', message: 'Mot de passe mis à jour avec succès.' };
}
