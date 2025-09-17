import { prisma } from '@/lib/db.js';

export async function GET() {
  try {
    const users = await prisma.user.count();
    return new Response(
      JSON.stringify({
        ok: true,
        provider: process.env.DATABASE_URL?.split('://')[0],
        users,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    const response = {
      ok: false,
      error: error?.message ?? String(error),
    };

    if (error?.code === 'P2021') {
      response.hint = 'La base de données est vide ou les migrations Prisma ne sont pas appliquées.';
    }

    return new Response(JSON.stringify(response), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}
