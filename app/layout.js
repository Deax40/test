import './globals.css'
import { Providers } from '../components/providers'

export const metadata = {
  title: 'ENGEL – QR Logs',
  description: 'Application de scan QR et administration'
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <Providers>
          <header className="border-b header-bar">
            <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
              <a className="brand flex items-center gap-2" href="/">
                <img src="/engel-logo.svg" alt="ENGEL" className="h-6 w-auto" />
              </a>
              <nav className="text-sm text-muted">
                <a className="mr-4 hover:underline" href="/">Technicien</a>
                <a className="hover:underline" href="/admin/panel">Admin</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-4xl px-6 py-8">
            {children}
          </main>
          <footer className="mx-auto max-w-4xl px-6 py-8 text-xs footer">
            © {new Date().getFullYear()} ENGEL
          </footer>
        </Providers>
      </body>
    </html>
  )
}
