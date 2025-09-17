import Link from 'next/link';

import { requireUser, isAdmin } from '@/lib/auth.js';
import { prisma } from '@/lib/db.js';

export const dynamic = 'force-dynamic';

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '—';
  }
}

export default async function Home() {
  const user = await requireUser();

  const [toolsCount, scanCount, syncedTools, recentScans] = await Promise.all([
    prisma.tool.count(),
    prisma.scan.count(),
    prisma.common.count(),
    prisma.scan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <DashboardCard label="Outils référencés" value={toolsCount} />
        <DashboardCard label="Scans effectués" value={scanCount} />
        <DashboardCard label="Fiches synchronisées" value={syncedTools} />
        {isAdmin(user) && <DashboardCard label="Espace administration" value="Accès complet" accent />}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Actions rapides</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <ActionLink href="/scan" label="Scanner un QR code" description="Accès caméra + formulaire" />
          <ActionLink href="/common" label="Consulter COMMON" description="Dernières informations outils" />
          {isAdmin(user) && (
            <ActionLink href="/admin" label="Administration" description="Gestion avancée (admins)" />
          )}
          <ActionLink href="/account" label="Mon compte" description="Profil et mot de passe" />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Derniers scans enregistrés</h2>
        {recentScans.length === 0 ? (
          <p style={{ margin: 0, color: '#4b5563' }}>Aucun scan n&apos;a encore été enregistré.</p>
        ) : (
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                <tr>
                  <th style={thStyle}>Outil</th>
                  <th style={thStyle}>Technicien</th>
                  <th style={thStyle}>Horodatage</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{scan.tool?.name ?? '—'}</td>
                    <td style={tdStyle}>{scan.user?.name ?? scan.user?.email ?? '—'}</td>
                    <td style={tdStyle}>{formatDate(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardCard({ label, value, accent = false }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: accent ? '#1d4ed8' : 'white',
        color: accent ? 'white' : '#0f172a',
        border: accent ? 'none' : '1px solid #e2e8f0',
        boxShadow: accent ? '0 20px 40px rgba(29, 78, 216, 0.35)' : '0 12px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: '0.9rem', opacity: accent ? 0.85 : 0.7 }}>{label}</span>
      <strong style={{ fontSize: '1.8rem' }}>{value}</strong>
    </div>
  );
}

function ActionLink({ href, label, description }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 18px',
        borderRadius: 12,
        border: '1px solid #dbeafe',
        background: 'white',
        boxShadow: '0 10px 20px rgba(37, 99, 235, 0.08)',
        color: '#1d4ed8',
        minWidth: 220,
        textDecoration: 'none',
      }}
    >
      <strong>{label}</strong>
      <span style={{ fontSize: '0.9rem', color: '#475569' }}>{description}</span>
    </Link>
  );
}

const thStyle = {
  padding: '12px 16px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#1f2937',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.95rem',
  color: '#0f172a',
};
