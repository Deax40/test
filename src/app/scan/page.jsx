import ScanClient from '@/app/scan/scan-client.jsx';
import { requireUser } from '@/lib/session.js';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const user = await requireUser(['ADMIN', 'TECH']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Scanner un QR code</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Autorisation : <strong>{user.role}</strong>. Activez la caméra de votre appareil pour identifier un outil à l&apos;aide de
          son QR code. Les informations peuvent être modifiées puis sauvegardées si le hash est reconnu.
        </p>
      </header>

      <ScanClient currentUser={user} />
    </div>
  );
}
