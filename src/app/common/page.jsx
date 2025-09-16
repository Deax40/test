import Link from 'next/link';

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

function formatValue(value) {
  if (value == null || value === '') {
    return '—';
  }
  return value;
}

export default async function CommonPage() {
  const entries = await prisma.common.findMany({
    orderBy: [{ toolName: 'asc' }],
  });

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Table COMMON</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Cette liste reflète en temps réel les dernières informations enregistrées pour chaque outil via la table
          <strong> SCAN</strong>.
        </p>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#2563eb' }}>Accueil</Link>
          <Link href="/scan" style={{ color: '#2563eb' }}>Enregistrer un nouveau scan</Link>
        </nav>
      </header>

      {entries.length === 0 ? (
        <p style={{ margin: 0, padding: '12px 16px', background: '#eff6ff', borderRadius: 8, color: '#1e3a8a' }}>
          Aucun outil n&apos;est encore synchronisé. Scannez un QR code pour créer automatiquement une entrée.
        </p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={thStyle}>Outil</th>
                <th style={thStyle}>Statut</th>
                <th style={thStyle}>Localisation</th>
                <th style={thStyle}>Opérateur</th>
                <th style={thStyle}>Numéro de série</th>
                <th style={thStyle}>Dernier scan</th>
                <th style={thStyle}>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={tdStyle}>{entry.toolName}</td>
                  <td style={tdStyle}>{formatValue(entry.status)}</td>
                  <td style={tdStyle}>{formatValue(entry.location)}</td>
                  <td style={tdStyle}>{formatValue(entry.operator)}</td>
                  <td style={tdStyle}>{formatValue(entry.serialNumber)}</td>
                  <td style={tdStyle}>{formatDate(entry.lastScanAt)}</td>
                  <td style={tdStyle}>{formatValue(entry.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle = {
  padding: '12px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#1f2937',
  borderBottom: '1px solid #e2e8f0',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '0.95rem',
  color: '#0f172a',
};
