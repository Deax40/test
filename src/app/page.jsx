import Link from 'next/link';

import LoginForm from '@/components/LoginForm';
import { formatRole, getCurrentUser } from '@/lib/auth';
import { logout } from './actions/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ marginBottom: 8 }}>Gestion des outils</h1>
        <p style={{ margin: 0 }}>
          Authentifiez-vous pour accéder aux pages Common (inventaire) et Scan (mise à jour rapide via QR code).
        </p>
      </header>

      {user ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, border: '1px solid #ccc', borderRadius: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px' }}>Connecté en tant que :</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{user.name ?? user.email}</p>
            <p style={{ margin: 0, color: '#555' }}>Rôle : {formatRole(user.role)}</p>
          </div>

          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/common" style={navLinkStyle}>
              Page Common
            </Link>
            <Link href="/scan" style={navLinkStyle}>
              Page Scan
            </Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" style={navLinkStyle}>
                Administration
              </Link>
            )}
          </nav>

          <form action={logout}>
            <button type="submit" style={buttonStyle}>
              Se déconnecter
            </button>
          </form>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LoginForm />
          <div style={{ fontSize: 14, color: '#555' }}>
            <p style={{ margin: '0 0 4px' }}>Comptes de démonstration :</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>tech@example.com (rôle Tech)</li>
              <li>admin@example.com (rôle Admin)</li>
            </ul>
          </div>
        </section>
      )}

      <section style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>
        <p style={{ marginTop: 0 }}>
          Cette application gère un inventaire centralisé d&apos;outils industriels. La page Common présente toutes les fiches,
          tandis que la page Scan relie un QR code (hash) à l&apos;outil correspondant pour mise à jour express des informations visibles.
        </p>
        <p style={{ marginBottom: 0 }}>
          L&apos;accès à l&apos;administration est réservé aux comptes Admin et sera développé ultérieurement.
        </p>
      </section>
    </main>
  );
}

const buttonStyle = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #888',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600
};

const navLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #ddd',
  textDecoration: 'none',
  color: '#1a1a1a',
  background: '#f6f6f6'
};
