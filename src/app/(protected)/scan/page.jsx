import { redirect } from 'next/navigation';
import { getToolByHash, updateTool } from '@/lib/tools';
import { requireRole } from '@/lib/auth';
import { normalizeHash } from '@/lib/hash';
import ScanSearch from './scan-search';

export const dynamic = 'force-dynamic';

async function saveToolAction(formData) {
  'use server';

  requireRole(['tech', 'admin']);

  const hash = formData.get('hash')?.toString();
  const normalizedHash = normalizeHash(hash);

  if (!normalizedHash) {
    redirect('/scan?error=missing-hash');
  }

  const updates = {
    identifier: formData.get('identifier')?.toString().trim() ?? '',
    weight: formData.get('weight')?.toString().trim() ?? '',
    date: formData.get('date')?.toString().trim() ?? '',
    lastUser: formData.get('lastUser')?.toString().trim() ?? '',
    dimensions: formData.get('dimensions')?.toString().trim() ?? '',
  };

  await updateTool(normalizedHash, updates);

  const params = new URLSearchParams({ hash: normalizedHash, saved: '1' });
  redirect(`/scan?${params.toString()}`);
}

export default async function ScanPage({ searchParams }) {
  const rawHash = typeof searchParams?.hash === 'string' ? searchParams.hash : '';
  const hash = normalizeHash(rawHash);
  const hasHashQuery = rawHash.trim().length > 0;
  const saved = searchParams?.saved === '1';
  const error = searchParams?.error === 'missing-hash';
  const tool = hash ? await getToolByHash(hash) : null;

  return (
    <main>
      <h1>Scan d'outil</h1>
      <p style={{ color: '#4b5563' }}>
        Scannez ou saisissez le QR code d'un outil pour afficher et mettre à jour ses informations.
      </p>

      <ScanSearch initialHash={hash} />

      {error && (
        <p style={{ color: '#c00', marginTop: 16 }}>
          Impossible de sauvegarder : aucun hash fourni.
        </p>
      )}

      {saved && (
        <p style={{ color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '8px 12px', borderRadius: 8, marginTop: 16 }}>
          Les informations de l'outil ont été mises à jour avec succès.
        </p>
      )}

      {hasHashQuery && !tool && (
        <p style={{ color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: 8, marginTop: 16 }}>
          Aucun outil ne correspond à ce hash. Vérifiez le QR code.
        </p>
      )}

      {tool && (
        <section style={{ marginTop: 32, padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>{tool.label}</h2>
          <p style={{ color: '#6b7280', marginTop: 4 }}>Hash sécurisé (non affiché ailleurs) : {tool.hash}</p>

          <form action={saveToolAction} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 24 }}>
            <input type="hidden" name="hash" value={tool.hash} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Numéro / e-mail associé</span>
              <input
                type="text"
                name="identifier"
                defaultValue={tool.identifier ?? ''}
                placeholder="Par ex. numéro d'inventaire"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Poids</span>
              <input
                type="text"
                name="weight"
                defaultValue={tool.weight ?? ''}
                placeholder="Ex. 2.5 kg"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Date (dernière utilisation ou contrôle)</span>
              <input
                type="text"
                name="date"
                defaultValue={tool.date ?? ''}
                placeholder="Ex. 12/09/2024"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Dernière personne ayant utilisé l'outil</span>
              <input
                type="text"
                name="lastUser"
                defaultValue={tool.lastUser ?? ''}
                placeholder="Nom et prénom"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Dimensions</span>
              <input
                type="text"
                name="dimensions"
                defaultValue={tool.dimensions ?? ''}
                placeholder="Ex. 20 × 15 cm"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  background: '#047857',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Valider les modifications
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
