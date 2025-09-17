import Link from 'next/link';
import { redirect } from 'next/navigation';

import { signInAction } from '@/app/actions/auth.js';
import { getCurrentUser } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

function getErrorMessage(code) {
  switch (code) {
    case 'invalid-credentials':
      return "Identifiants incorrects. Vérifiez l'adresse e-mail et le mot de passe.";
    case 'session-expired':
      return 'Votre session a expiré. Merci de vous reconnecter.';
    default:
      return null;
  }
}

export default async function LoggingPage({ searchParams }) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect('/');
  }

  const error = getErrorMessage(searchParams?.error);
  const redirectTo = typeof searchParams?.redirectTo === 'string' ? searchParams.redirectTo : '/';

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Connexion interne</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Utilisez vos identifiants professionnels pour accéder aux outils de suivi des QR codes.
        </p>
      </section>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fee2e2', color: '#b91c1c' }}>{error}</div>
      )}

      <form
        action={signInAction}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          background: 'white',
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.12)',
        }}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="prenom.nom@entreprise.fr"
            style={inputStyle}
            autoComplete="username"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="password" style={{ fontWeight: 600 }}>
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            style={inputStyle}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '12px 18px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Se connecter
        </button>
      </form>

      <section style={{ fontSize: '0.9rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>Accès de démonstration :</span>
        <code style={codeStyle}>admin@example.com / Admin#1234</code>
        <code style={codeStyle}>tech@example.com / Tech#1234</code>
        <Link href="/api/health/db" style={{ color: '#2563eb', marginTop: 8 }}>
          Vérifier la connexion base de données
        </Link>
      </section>
    </main>
  );
}

const inputStyle = {
  borderRadius: 10,
  border: '1px solid #cbd5f5',
  padding: '12px 14px',
  fontSize: '1rem',
};

const codeStyle = {
  padding: '4px 8px',
  background: '#e0f2fe',
  borderRadius: 6,
  fontFamily: 'monospace',
};
