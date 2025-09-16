export default function RootLayout({ children }) {
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
        {children}
      </body>
    </html>
  );
}
