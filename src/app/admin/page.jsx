import { requireUser } from '@/lib/session.js';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  await requireUser(['ADMIN']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ margin: 0 }}>Espace administration</h1>
      <p style={{ margin: 0, color: '#475569' }}>
        Cette zone est réservée aux administrateurs. Le contenu sera enrichi ultérieurement avec des outils de supervision et de
        gestion avancée.
      </p>
      <div
        style={{
          padding: '24px 28px',
          borderRadius: 18,
          background: '#f8fafc',
          border: '1px dashed rgba(148, 163, 184, 0.6)',
          color: '#64748b',
        }}
      >
        Modules à venir :
        <ul style={{ margin: '12px 0 0 20px', padding: 0, lineHeight: 1.6 }}>
          <li>Administration des comptes utilisateurs</li>
          <li>Gestion des QR codes et impression</li>
          <li>Tableaux de bord de suivi</li>
        </ul>
      </div>
    </div>
  );
}
