import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/actions/auth';
import { formatRole, getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Administration</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Espace réservé aux administrateurs. Les fonctionnalités complémentaires seront ajoutées ultérieurement.
          </p>
        </div>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Connecté : {user.name ?? user.email}</span>
          <span style={{ color: '#666' }}>Rôle : {formatRole(user.role)}</span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/common" style={navLinkStyle}>
              Inventaire
            </Link>
            <Link href="/scan" style={navLinkStyle}>
              Scan
            </Link>
            <Link href="/" style={navLinkStyle}>
              Accueil
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" style={buttonStyle}>
              Se déconnecter
            </button>
          </form>
        </section>
      </header>

      <section style={{ padding: 24, borderRadius: 12, border: '1px dashed #bbb', background: '#f9f9f9' }}>
        <p style={{ margin: 0 }}>
          Module d&apos;administration à concevoir. Cette page confirmera l&apos;accès étendu des comptes Admin lorsque les besoins
          seront précisés.
        </p>
      </section>
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
