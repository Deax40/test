'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db.js';

function cleanInput(value) {
  if (typeof value !== 'string') {
    if (value == null) return null;
    value = String(value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveScanAction(formData) {
  const toolName = cleanInput(formData.get('toolName'));
  if (!toolName) {
    redirect('/scan?error=missing-tool');
  }

  const serialNumber = cleanInput(formData.get('serialNumber'));
  const status = cleanInput(formData.get('status'));
  const location = cleanInput(formData.get('location'));
  const operator = cleanInput(formData.get('operator'));
  const note = cleanInput(formData.get('note'));

  const scan = await prisma.scan.create({
    data: {
      toolName,
      serialNumber,
      status,
      location,
      operator,
      note,
    },
  });

  await prisma.common.upsert({
    where: { toolName },
    update: {
      serialNumber,
      status,
      location,
      operator,
      note,
      lastScanAt: scan.createdAt,
      lastScanId: scan.id,
    },
    create: {
      toolName,
      serialNumber,
      status,
      location,
      operator,
      note,
      lastScanAt: scan.createdAt,
      lastScanId: scan.id,
    },
  });

  revalidatePath('/common');
  revalidatePath('/scan');
  redirect('/common');
}
