import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="section-card">
      <h1>Plateforme de gestion des outils</h1>
      <p>
        Sélectionnez votre rôle dans l’en-tête pour accéder aux fonctionnalités dédiées.
        Les techniciens disposent des pages <strong>Common</strong> et <strong>Scan</strong> tandis que les
        administrateurs bénéficient en plus d’un espace d’administration.
      </p>
      <div className="notice">
        <p>
          <strong>Common :</strong> liste centralisée des outils. <strong>Scan :</strong> mise à jour rapide via QR
          code. Les QR codes restent liés au hash conservé en base de données et ne sont jamais affichés à l’écran.
        </p>
      </div>
      <ul>
        <li>
          <Link href="/common">Accéder à la base Common</Link>
        </li>
        <li>
          <Link href="/scan">Scanner un outil</Link>
        </li>
        <li>
          <Link href="/admin">Espace d’administration</Link>
        </li>
      </ul>
    </div>
  );
}
