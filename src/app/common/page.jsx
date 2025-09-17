import { prisma } from '@/lib/db.js';
import { requireUser } from '@/lib/session.js';

export const dynamic = 'force-dynamic';

function formatValue(value) {
  if (value == null || value === '') {
    return '—';
  }
  return value;
}

function formatDate(date) {
  if (!date) {
    return '—';
  }
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

export default async function CommonPage() {
  await requireUser(['ADMIN', 'TECH']);

  const tools = await prisma.tool.findMany({
    orderBy: { name: 'asc' },
    include: {
      lastScannedBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Table COMMON</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          La table ci-dessous reflète l&apos;état consolidé de chaque outil après synchronisation depuis le module de scan.
        </p>
      </header>

      {tools.length === 0 ? (
        <p style={{ padding: '16px 20px', background: '#eff6ff', borderRadius: 12, color: '#1d4ed8', margin: 0 }}>
          Aucun outil n&apos;a encore été importé. Scannez un QR code valide pour initialiser la base.
        </p>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            borderRadius: 18,
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            boxShadow: '0 10px 35px rgba(15, 23, 42, 0.12)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                <th style={thStyle}>Nom</th>
                <th style={thStyle}>Hash QR</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Localisation</th>
                <th style={thStyle}>Opérateur</th>
                <th style={thStyle}>Commentaire</th>
                <th style={thStyle}>Dernier scan</th>
                <th style={thStyle}>Scanné par</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={tdStyle}>{tool.name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem' }}>{tool.hash}</td>
                  <td style={tdStyle}>{formatValue(tool.description)}</td>
                  <td style={tdStyle}>{formatValue(tool.status)}</td>
                  <td style={tdStyle}>{formatValue(tool.location)}</td>
                  <td style={tdStyle}>{formatValue(tool.operator)}</td>
                  <td style={tdStyle}>{formatValue(tool.note)}</td>
                  <td style={tdStyle}>{formatDate(tool.lastScannedAt)}</td>
                  <td style={tdStyle}>
                    {tool.lastScannedBy
                      ? tool.lastScannedBy.name || tool.lastScannedBy.email
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '14px 16px',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: '#1f2937',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.95rem',
  color: '#1e293b',
  verticalAlign: 'top',
  background: 'white',
};
