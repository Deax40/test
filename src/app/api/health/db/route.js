import { prisma } from '@/lib/db.js';

export async function GET() {
  try {
    // simple check: count users
    const users = await prisma.user.count();
    return new Response(JSON.stringify({ ok: true, provider: process.env.DATABASE_URL?.split('://')[0], users }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
