import Link from 'next/link';
import { requireRole, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function logoutAction() {
  'use server';

  logout();
  redirect('/login');
}

export default function ProtectedLayout({ children }) {
  const session = requireRole(['tech', 'admin']);

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <strong>Suivi des outils</strong>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Connecté en tant que {session.name ?? session.email} ({session.role})
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/common">Common</Link>
          <Link href="/scan">Scan</Link>
          {session.role === 'admin' && <Link href="/admin">Administration</Link>}
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Déconnexion
            </button>
          </form>
        </nav>
      </header>
      <div style={{ padding: '0 24px 48px' }}>{children}</div>
    </div>
  );
}
