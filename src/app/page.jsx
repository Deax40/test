import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Suivi des outils par QR code</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          Cette interface permet d&apos;enregistrer un matériel scanné dans la table <strong>SCAN</strong> et de mettre à
          jour automatiquement la table <strong>COMMON</strong> afin de conserver l&apos;état le plus récent de chaque
          équipement.
        </p>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Actions rapides</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <li>
            <Link href="/scan" style={{ color: '#2563eb' }}>
              Scanner un équipement et enregistrer les informations (table SCAN)
            </Link>
          </li>
          <li>
            <Link href="/common" style={{ color: '#2563eb' }}>
              Consulter la table COMMON synchronisée en temps réel
            </Link>
          </li>
          <li>
            <a href="/api/health/db" style={{ color: '#2563eb' }}>
              Vérifier la connexion base de données
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
