import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db.js';
import { getCurrentUser } from '@/lib/auth.js';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const hash = typeof body?.hash === 'string' ? body.hash.trim().toLowerCase() : '';
  if (!hash) {
    return NextResponse.json({ error: 'missing-hash' }, { status: 400 });
  }

  const tool = await prisma.tool.findUnique({
    where: { hash },
    include: {
      common: true,
    },
  });

  if (!tool) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    tool: {
      id: tool.id,
      name: tool.name,
      hash: tool.hash,
    },
    common: tool.common
      ? {
          serialNumber: tool.common.serialNumber ?? '',
          status: tool.common.status ?? '',
          location: tool.common.location ?? '',
          operator: tool.common.operator ?? '',
          note: tool.common.note ?? '',
          lastScanAt: tool.common.lastScanAt,
          updatedAt: tool.common.updatedAt,
        }
      : null,
  });
}
