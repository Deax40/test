import Link from 'next/link';

import { saveScanAction } from '@/app/actions/scans.js';

export const dynamic = 'force-dynamic';

export default function ScanPage({ searchParams }) {
  const hasError = searchParams?.error === 'missing-tool';

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Enregistrer un scan</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Les informations saisies via ce formulaire sont enregistrées dans la table <strong>SCAN</strong> puis
          synchronisées automatiquement dans la table <strong>COMMON</strong>.
        </p>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#2563eb' }}>Accueil</Link>
          <Link href="/common" style={{ color: '#2563eb' }}>Voir la table COMMON</Link>
        </nav>
      </header>

      {hasError && (
        <p style={{ margin: 0, padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
          Le nom de l&apos;outil est obligatoire pour enregistrer un scan.
        </p>
      )}

      <form
        action={saveScanAction}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: '#fff',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="toolName" style={{ fontWeight: 600 }}>
            Nom de l&apos;outil (issu du QR code)
          </label>
          <input
            id="toolName"
            name="toolName"
            required
            placeholder="Caméra d'inspection GLEIZE"
            style={inputStyle}
            autoComplete="off"
          />
        </div>

        <div style={groupStyle}>
          <div style={{ ...groupColumnStyle }}>
            <label htmlFor="serialNumber" style={{ fontWeight: 600 }}>Numéro de série</label>
            <input id="serialNumber" name="serialNumber" style={inputStyle} placeholder="SN-001234" />
          </div>
          <div style={{ ...groupColumnStyle }}>
            <label htmlFor="status" style={{ fontWeight: 600 }}>Statut</label>
            <input id="status" name="status" style={inputStyle} placeholder="Disponible, En réparation…" />
          </div>
        </div>

        <div style={groupStyle}>
          <div style={{ ...groupColumnStyle }}>
            <label htmlFor="location" style={{ fontWeight: 600 }}>Localisation</label>
            <input id="location" name="location" style={inputStyle} placeholder="Atelier Lyon" />
          </div>
          <div style={{ ...groupColumnStyle }}>
            <label htmlFor="operator" style={{ fontWeight: 600 }}>Opérateur</label>
            <input id="operator" name="operator" style={inputStyle} placeholder="Nom du technicien" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="note" style={{ fontWeight: 600 }}>Commentaire</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Observation relevée lors du contrôle"
          />
        </div>

        <button
          type="submit"
          style={{
            alignSelf: 'flex-start',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Valider et synchroniser
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  borderRadius: 8,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  fontSize: '1rem',
};

const groupStyle = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
};

const groupColumnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  flex: 1,
};
