export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{fontFamily:'system-ui, sans-serif', margin:0, padding:24}}>
        {children}
      </body>
    </html>
  );
}
