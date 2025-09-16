import './globals.css';
import AppShell from '@/components/AppShell.jsx';
import { RoleProvider } from '@/lib/role-context.jsx';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <RoleProvider>
          <AppShell>{children}</AppShell>
        </RoleProvider>
      </body>
    </html>
  );
}
