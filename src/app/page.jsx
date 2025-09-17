import Link from 'next/link';

import { prisma } from '@/lib/db.js';
import { requireUser } from '@/lib/session.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireUser(['ADMIN', 'TECH']);

  const [toolCount, lastUpdate] = await Promise.all([
    prisma.tool.count(),
    prisma.tool.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true },
    }),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Bonjour {user.name ?? user.email}</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Gérez le parc d&apos;outillage grâce aux QR codes. Toutes les actions sont journalisées et l&apos;accès est limité selon
          votre rôle <strong>{user.role}</strong>.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Outils référencés</span>
          <span style={statValueStyle}>{toolCount}</span>
        </div>
        <div style={statCardStyle}>
          <span style={statLabelStyle}>Dernière mise à jour</span>
          <span style={statValueStyle}>
            {lastUpdate?.updatedAt
              ? new Date(lastUpdate.updatedAt).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Aucune modification'}
          </span>
          {lastUpdate?.name && (
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Dernier outil modifié : {lastUpdate.name}</span>
          )}
        </div>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Actions rapides</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <ActionCard
            title="Scanner un outil"
            description="Ouvrez le lecteur caméra, scannez le QR code et mettez à jour les informations en direct."
            href="/scan"
          />
          <ActionCard
            title="Consulter la base"
            description="Visualisez la table COMMON consolidée de tous les outils et leurs informations à jour."
            href="/common"
          />
          {user.role === 'ADMIN' && (
            <ActionCard
              title="Administration"
              description="Accédez à l&apos;espace d&apos;administration pour préparer les développements futurs."
              href="/admin"
            />
          )}
          <ActionCard
            title="Mon profil"
            description="Consultez les informations de votre compte et changez votre mot de passe."
            href="/profile"
          />
        </div>
      </section>
    </div>
  );
}

function ActionCard({ title, description, href }) {
  return (
    <Link
      href={href}
      style={{
        padding: '20px 24px',
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        textDecoration: 'none',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      prefetch
    >
      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{title}</span>
      <span style={{ color: '#475569', fontSize: '0.95rem' }}>{description}</span>
      <span style={{ fontWeight: 600, color: '#2563eb' }}>Accéder →</span>
    </Link>
  );
}

const statCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '18px 20px',
  borderRadius: 18,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: '#f1f5f9',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
};

const statLabelStyle = {
  fontSize: '0.9rem',
  color: '#475569',
};

const statValueStyle = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#0f172a',
};
