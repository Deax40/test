import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, login } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function handleLogin(formData) {
  'use server';

  const email = formData.get('email')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  const redirectTo = formData.get('redirectTo')?.toString() || '/common';

  const user = await login(email, password);

  if (!user) {
    const search = new URLSearchParams({
      error: '1',
      next: redirectTo,
    });

    redirect(`/login?${search.toString()}`);
  }

  redirect(redirectTo);
}

export default function LoginPage({ searchParams }) {
  const session = getSession();
  const nextUrl = typeof searchParams?.next === 'string' ? searchParams.next : '/common';
  const hasError = searchParams?.error === '1';

  if (session) {
    redirect(nextUrl || '/common');
  }

  return (
    <main style={{ maxWidth: 420, margin: '64px auto', padding: 24, border: '1px solid #e5e5e5', borderRadius: 12, background: '#fff' }}>
      <h1 style={{ marginTop: 0 }}>Connexion</h1>
      <p style={{ color: '#555' }}>
        Veuillez entrer vos identifiants pour accéder à la gestion des outils.
      </p>
      {hasError && (
        <p style={{ color: '#c00', background: '#ffecec', border: '1px solid #f5c2c7', padding: '8px 12px', borderRadius: 8 }}>
          Identifiants invalides. Merci de réessayer.
        </p>
      )}
      <form action={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <input type="hidden" name="redirectTo" value={nextUrl} />
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Adresse e-mail</span>
          <input
            type="email"
            name="email"
            required
            placeholder="ex: tech@example.com"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d0d7de' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>Mot de passe</span>
          <input
            type="password"
            name="password"
            required
            placeholder="Votre mot de passe"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d0d7de' }}
          />
        </label>
        <button
          type="submit"
          style={{
            background: '#111827',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Se connecter
        </button>
      </form>
      <p style={{ marginTop: 32, fontSize: 14, color: '#6b7280' }}>
        Accès technicien : <code>tech@example.com / tech123</code>
        <br />
        Accès administrateur : <code>admin@example.com / admin123</code>
      </p>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Besoin d'aide ? <Link href="mailto:support@example.com">Contactez le support</Link>.
      </p>
    </main>
  );
}
