'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_LABELS, ROLES, useRole } from '@/lib/role-context.jsx';

const navigation = [
  { href: '/common', label: 'Common', roles: [ROLES.TECH, ROLES.ADMIN] },
  { href: '/scan', label: 'Scan', roles: [ROLES.TECH, ROLES.ADMIN] },
  { href: '/admin', label: 'Administration', roles: [ROLES.ADMIN] },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { role, setRole } = useRole();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Gestion des outils</div>
        <nav className="app-nav">
          {navigation.map((item) => {
            const allowed = item.roles.includes(role);
            const isActive = pathname.startsWith(item.href);

            if (!allowed) {
              return (
                <span key={item.href} className="nav-link disabled" aria-disabled>
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="role-switcher">
          <label htmlFor="role-select">Rôle</label>
          <select
            id="role-select"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {Object.values(ROLES).map((roleKey) => (
              <option key={roleKey} value={roleKey}>
                {ROLE_LABELS[roleKey]}
              </option>
            ))}
          </select>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
