import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/actions/auth';
import { formatRole, getCurrentUser } from '@/lib/auth';

import ScanClient from './ScanClient';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Scan & mise à jour</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Identifiez un outil via son QR code puis mettez à jour ses informations visibles. Les changements sont enregistrés
            immédiatement dans la base Common.
          </p>
        </div>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Connecté : {user.name ?? user.email}</span>
          <span style={{ color: '#666' }}>Rôle : {formatRole(user.role)}</span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/common" style={navLinkStyle}>
              Inventaire
            </Link>
            <Link href="/" style={navLinkStyle}>
              Accueil
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
      </header>

      <ScanClient />
    </main>
  );
}

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

const buttonStyle = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #888',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 600
};
