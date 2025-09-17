'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';

function cleanInput(value) {
  if (typeof value !== 'string') {
    if (value == null) return null;
    value = String(value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function saveScanAction(formData) {
  const user = await requireUser();

  const rawToolId = formData.get('toolId');
  const toolId = Number(rawToolId);
  if (!rawToolId || Number.isNaN(toolId)) {
    redirect('/scan?error=missing-tool');
  }

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) {
    redirect('/scan?error=unknown-tool');
  }

  const serialNumber = cleanInput(formData.get('serialNumber'));
  const status = cleanInput(formData.get('status'));
  const location = cleanInput(formData.get('location'));
  const operator = cleanInput(formData.get('operator'));
  const note = cleanInput(formData.get('note'));

  const scan = await prisma.scan.create({
    data: {
      toolId,
      userId: user.id,
      serialNumber,
      status,
      location,
      operator,
      note,
    },
  });

  await prisma.common.upsert({
    where: { toolId },
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
      toolId,
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

  const params = new URLSearchParams({ status: 'success', toolId: String(toolId) });
  redirect(`/scan?${params.toString()}`);
}
