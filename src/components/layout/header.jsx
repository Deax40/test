'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context.jsx';
import { logoutAction } from '@/app/actions/auth.js';

const linkStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: '0.9rem',
  fontWeight: 500,
  textDecoration: 'none',
};

const navConfig = [
  { href: '/', label: 'Accueil', roles: ['ADMIN', 'TECH'] },
  { href: '/scan', label: 'Scan', roles: ['ADMIN', 'TECH'] },
  { href: '/common', label: 'Common', roles: ['ADMIN', 'TECH'] },
  { href: '/admin', label: 'Administration', roles: ['ADMIN'] },
  { href: '/profile', label: 'Profil', roles: ['ADMIN', 'TECH'] },
];

export default function Header() {
  const pathname = usePathname();
  const { session } = useAuth();

  const activeRole = session?.user?.role;

  const filteredLinks = navConfig.filter((link) => {
    if (!activeRole) {
      return false;
    }
    return link.roles.includes(activeRole);
  });

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '16px 24px',
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.85)',
        color: 'white',
        position: 'sticky',
        top: 16,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>Suivi des outils</span>
        {session?.user ? (
          <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>
            {session.user.email} · rôle {session.user.role}
          </span>
        ) : (
          <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>Veuillez vous connecter</span>
        )}
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {filteredLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                ...linkStyles,
                background: isActive ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: isActive ? '#bfdbfe' : '#e0f2fe',
                border: '1px solid rgba(148, 163, 184, 0.25)',
              }}
            >
              {link.label}
            </Link>
          );
        })}

        {session?.user ? (
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                ...linkStyles,
                background: '#f8fafc',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Se déconnecter
            </button>
          </form>
        ) : (
          <Link
            href="/logging"
            style={{
              ...linkStyles,
              background: '#f8fafc',
              color: '#0f172a',
              border: 'none',
            }}
          >
            Connexion
          </Link>
        )}
      </nav>
    </header>
  );
}
