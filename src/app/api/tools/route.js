import { prisma } from '@/lib/db.js';

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: { name: 'asc' },
    });
    return Response.json({ tools });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Unable to load tools' }, { status: 500 });
  }
}
