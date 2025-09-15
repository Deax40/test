import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

function serializeTool(tool) {
  return {
    name: tool.name,
    contactInfo: tool.contactInfo ?? '',
    weight: tool.weight ?? '',
    scheduledAt: tool.scheduledAt ? tool.scheduledAt.toISOString() : null,
    lastUser: tool.lastUser ?? '',
    dimensions: tool.dimensions ?? ''
  };
}

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const hash = params?.hash;
  if (!hash) {
    return NextResponse.json({ error: 'Hash manquant' }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({ where: { hash } });
  if (!tool) {
    return NextResponse.json({ error: 'Outil introuvable' }, { status: 404 });
  }

  return NextResponse.json(serializeTool(tool));
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const hash = params?.hash;
  if (!hash) {
    return NextResponse.json({ error: 'Hash manquant' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  const { contactInfo, weight, scheduledAt, lastUser, dimensions } = body ?? {};

  let scheduledDate = null;
  if (scheduledAt) {
    const parsed = new Date(scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Date non valide' }, { status: 400 });
    }
    scheduledDate = parsed;
  }

  try {
    const updated = await prisma.tool.update({
      where: { hash },
      data: {
        contactInfo: normalizeString(contactInfo),
        weight: normalizeString(weight),
        scheduledAt: scheduledDate,
        lastUser: normalizeString(lastUser),
        dimensions: normalizeString(dimensions)
      }
    });

    revalidatePath('/common');

    return NextResponse.json(serializeTool(updated));
  } catch (error) {
    return NextResponse.json({ error: 'Impossible de mettre à jour l\'outil.' }, { status: 500 });
  }
}
