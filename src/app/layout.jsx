import Header from '@/components/layout/header.jsx';
import { AuthProvider } from '@/components/auth/auth-context.jsx';
import { getSession } from '@/lib/session.js';

export const metadata = {
  title: 'Suivi des outils',
  description: 'Gestion des équipements par QR code avec contrôle d\'accès.',
};

export default async function RootLayout({ children }) {
  const session = await getSession();

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          margin: 0,
          padding: 24,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #1e293b 100%)',
          color: '#0f172a',
          minHeight: '100vh',
        }}
      >
        <AuthProvider initialSession={session}>
          <div
            style={{
              maxWidth: 1080,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <Header />
            <main
              style={{
                background: 'white',
                padding: '24px 28px',
                borderRadius: 20,
                boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
