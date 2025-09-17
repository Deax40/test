import Link from 'next/link';

import { saveScanAction } from '@/app/actions/scans.js';
import { prisma } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';

import ScanClient from './ScanClient.jsx';

export const dynamic = 'force-dynamic';

function getErrorMessage(code) {
  switch (code) {
    case 'missing-tool':
      return 'Aucun outil n\'a été détecté. Veuillez scanner un QR code valide.';
    case 'unknown-tool':
      return 'Ce QR code est inconnu. Vérifiez qu\'il a bien été enregistré dans la base.';
    default:
      return null;
  }
}

export default async function ScanPage({ searchParams }) {
  await requireUser();

  const resolvedSearchParams = ((await searchParams) ?? {});
  const rawError = resolvedSearchParams.error;
  const rawStatus = resolvedSearchParams.status;
  const rawToolId = resolvedSearchParams.toolId;
  const errorMessage = getErrorMessage(Array.isArray(rawError) ? rawError[0] : rawError);
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const toolIdValue = Array.isArray(rawToolId) ? rawToolId[0] : rawToolId;
  const isSuccess = statusValue === 'success';
  const toolId = Number(toolIdValue);
  const successTool = isSuccess && !Number.isNaN(toolId)
    ? await prisma.tool.findUnique({ where: { id: toolId }, select: { name: true } })
    : null;

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Scanner un outil</h1>
        <p style={{ margin: 0, color: '#555' }}>
          Scannez un QR code pour retrouver automatiquement l&apos;outil associé. Les informations sont enregistrées dans la
          table <strong>SCAN</strong> et synchronisées avec <strong>COMMON</strong>.
        </p>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#2563eb' }}>Accueil</Link>
          <Link href="/common" style={{ color: '#2563eb' }}>Voir la table COMMON</Link>
        </nav>
      </header>

      {isSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
          Les informations ont été enregistrées pour l&apos;outil <strong>{successTool?.name ?? 'sélectionné'}</strong>.
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
          {errorMessage}
        </div>
      )}

      <ScanClient saveAction={saveScanAction} />
    </main>
  );
}
