import { requireAdmin } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Espace administration</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Bonjour {user.name ?? user.email}, vous disposez d&apos;un accès complet à l&apos;ensemble des modules. Des
          fonctionnalités supplémentaires pourront être ajoutées ici (gestion des utilisateurs, rapports avancés...).
        </p>
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 16,
          background: 'white',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Fonctionnalités à venir</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Gestion centralisée des utilisateurs et des rôles.</li>
          <li>Historique complet des modifications par outil.</li>
          <li>Exports CSV / Excel des tables COMMON et SCAN.</li>
          <li>Suivi des QR codes non scannés depuis plus de X jours.</li>
        </ul>
      </section>
    </main>
  );
}
