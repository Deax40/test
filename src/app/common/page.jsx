import Link from 'next/link';
import { redirect } from 'next/navigation';

import { logout } from '@/app/actions/auth';
import { formatRole, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CommonPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const tools = await prisma.tool.findMany({ orderBy: { name: 'asc' } });

  return (
    <main style={{ maxWidth: 1024, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>Inventaire commun</h1>
          <p style={{ margin: 0, color: '#555' }}>
            Tous les outils enregistrés sont listés ci-dessous. Les informations visibles peuvent être mises à jour via la page
            Scan. Le hash unique reste stocké en base et n&apos;est jamais affiché ici.
          </p>
        </div>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Connecté : {user.name ?? user.email}</span>
          <span style={{ color: '#666' }}>Rôle : {formatRole(user.role)}</span>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/scan" style={navLinkStyle}>
              Aller sur Scan
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

      <section style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <strong>{tools.length}</strong> outil{tools.length > 1 ? 's' : ''}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={thStyle}>Outil</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Poids</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Dernier utilisateur</th>
                <th style={thStyle}>Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{tool.name}</span>
                  </td>
                  <td style={tdStyle}>{tool.contactInfo ?? '—'}</td>
                  <td style={tdStyle}>{tool.weight ?? '—'}</td>
                  <td style={tdStyle}>{formatDate(tool.scheduledAt)}</td>
                  <td style={tdStyle}>{tool.lastUser ?? '—'}</td>
                  <td style={tdStyle}>{tool.dimensions ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR').format(value instanceof Date ? value : new Date(value));
  } catch (error) {
    return '—';
  }
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

const thStyle = {
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  color: '#444'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#222'
};
