import { prisma } from '@/lib/db.js';

function sanitisePayload(payload) {
  const { name, contact, weight, referenceDate, lastUser, dimensions, notes } = payload;
  const data = {};

  if (typeof name === 'string') data.name = name.trim();
  if (typeof contact === 'string' || contact === null) data.contact = contact?.trim() || null;
  if (typeof weight === 'string' || weight === null) data.weight = weight?.trim() || null;
  if (typeof lastUser === 'string' || lastUser === null) data.lastUser = lastUser?.trim() || null;
  if (typeof dimensions === 'string' || dimensions === null) data.dimensions = dimensions?.trim() || null;
  if (typeof notes === 'string' || notes === null) data.notes = notes?.trim() || null;

  if (referenceDate) {
    const date = new Date(referenceDate);
    if (!Number.isNaN(date.getTime())) {
      data.referenceDate = date;
    }
  } else if (referenceDate === null) {
    data.referenceDate = null;
  }

  return data;
}

export async function GET(request, { params }) {
  const hash = params.hash;
  try {
    const tool = await prisma.tool.findUnique({
      where: { hash },
    });
    if (!tool) {
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }
    return Response.json(tool);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Unable to read tool' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const hash = params.hash;
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const updated = await prisma.tool.update({
      where: { hash },
      data: sanitisePayload(payload),
    });
    return Response.json(updated);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Unable to update tool' }, { status: 500 });
  }
}
