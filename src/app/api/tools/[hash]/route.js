import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/db.js';
import { getSessionPayloadFromRequest } from '@/lib/session.js';

const ROLE_CAN_EDIT = ['ADMIN', 'TECH'];

function sanitizeOptional(value, { maxLength = 1024 } = {}) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function validatePayload(body) {
  const errors = {};
  const result = {};

  if (typeof body?.name !== 'string' || body.name.trim().length < 2) {
    errors.name = "Le nom de l'outil est obligatoire (2 caractères minimum).";
  } else {
    result.name = body.name.trim();
  }

  const description = sanitizeOptional(body?.description, { maxLength: 2048 });
  if (body?.description && !description) {
    errors.description = 'Description invalide.';
  } else {
    result.description = description;
  }

  result.status = sanitizeOptional(body?.status, { maxLength: 255 });
  result.location = sanitizeOptional(body?.location, { maxLength: 255 });
  result.operator = sanitizeOptional(body?.operator, { maxLength: 255 });
  result.note = sanitizeOptional(body?.note, { maxLength: 2048 });

  return { data: result, errors };
}

function formatHistoryPayload(previous, updates, session) {
  return {
    performedBy: {
      id: session.sub,
      email: session.email,
      role: session.role,
    },
    previous: {
      name: previous.name,
      description: previous.description,
      status: previous.status,
      location: previous.location,
      operator: previous.operator,
      note: previous.note,
    },
    next: updates,
    updatedAt: new Date().toISOString(),
  };
}

function toolSelect() {
  return {
    id: true,
    hash: true,
    name: true,
    description: true,
    status: true,
    location: true,
    operator: true,
    note: true,
    lastScannedAt: true,
    updatedAt: true,
    createdAt: true,
    lastScannedBy: {
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    },
  };
}

export async function GET(request, { params }) {
  const session = await getSessionPayloadFromRequest(request);
  if (!session || !ROLE_CAN_EDIT.includes(session.role)) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  const hash = params?.hash;
  if (!hash || typeof hash !== 'string') {
    return NextResponse.json({ error: 'Hash manquant.' }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({ where: { hash }, select: toolSelect() });
  if (!tool) {
    return NextResponse.json({ error: 'QR code non reconnu.' }, { status: 404 });
  }

  return NextResponse.json({ tool });
}

export async function PATCH(request, { params }) {
  const session = await getSessionPayloadFromRequest(request);
  if (!session || !ROLE_CAN_EDIT.includes(session.role)) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 401 });
  }

  const hash = params?.hash;
  if (!hash || typeof hash !== 'string') {
    return NextResponse.json({ error: 'Hash manquant.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const { data: updates, errors } = validatePayload(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation échouée.', details: errors }, { status: 422 });
  }

  const [existing, operator] = await Promise.all([
    prisma.tool.findUnique({ where: { hash } }),
    prisma.user.findUnique({ where: { id: session.sub }, select: { id: true } }),
  ]);
  if (!existing) {
    return NextResponse.json({ error: 'QR code non reconnu.' }, { status: 404 });
  }
  if (!operator) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 401 });
  }

  const now = new Date();
  const historyPayload = formatHistoryPayload(existing, updates, session);

  const updated = await prisma.tool.update({
    where: { hash },
    data: {
      name: updates.name,
      description: updates.description,
      status: updates.status,
      location: updates.location,
      operator: updates.operator,
      note: updates.note,
      lastScannedAt: now,
      lastScannedBy: { connect: { id: session.sub } },
      histories: {
        create: {
          changes: historyPayload,
          performedById: session.sub,
        },
      },
    },
    select: toolSelect(),
  });

  await prisma.toolHistory.deleteMany({ where: { toolId: updated.id, createdAt: { lt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365) } } }).catch(() => {});

  revalidatePath('/common');
  revalidatePath('/');

  return NextResponse.json({ tool: updated });
}
