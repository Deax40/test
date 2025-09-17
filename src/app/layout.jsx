import Link from 'next/link';

import { signOutAction } from '@/app/actions/auth.js';
import { getCurrentUser, isAdmin } from '@/lib/auth.js';

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          margin: 0,
          padding: 24,
          background: '#f8fafc',
          color: '#0f172a',
          minHeight: '100vh',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {user ? (
            <header
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 24,
                borderRadius: 16,
                background: '#0f172a',
                color: 'white',
                boxShadow: '0 25px 40px rgba(15, 23, 42, 0.18)',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', flex: '1 1 auto' }}>Portail outils QR</h1>
                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  {user.name ? `${user.name} • ${user.email}` : user.email} — rôle {user.role.toLowerCase()}
                </div>
              </div>
              <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link href="/" style={navLinkStyle}>
                  Tableau de bord
                </Link>
                <Link href="/scan" style={navLinkStyle}>
                  Scan
                </Link>
                <Link href="/common" style={navLinkStyle}>
                  Common
                </Link>
                {isAdmin(user) && (
                  <Link href="/admin" style={navLinkStyle}>
                    Administration
                  </Link>
                )}
                <Link href="/account" style={navLinkStyle}>
                  Mon compte
                </Link>
                <form action={signOutAction} style={{ marginLeft: 'auto' }}>
                  <button
                    type="submit"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: 999,
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Déconnexion
                  </button>
                </form>
              </nav>
            </header>
          ) : (
            <header
              style={{
                padding: 24,
                borderRadius: 16,
                background: '#0f172a',
                color: 'white',
                boxShadow: '0 25px 40px rgba(15, 23, 42, 0.18)',
              }}
            >
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Portail outils QR</h1>
              <p style={{ margin: '8px 0 0', fontSize: '0.95rem', opacity: 0.85 }}>
                Identifiez-vous pour accéder aux fonctionnalités de suivi.
              </p>
            </header>
          )}

          <div style={{ flex: '1 1 auto' }}>{children}</div>
        </div>
      </body>
    </html>
  );
}

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 600,
  padding: '8px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.2)',
};
