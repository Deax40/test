import { requireRole } from '@/lib/auth';
import { getAllTools } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = requireRole(['admin']);
  const tools = await getAllTools();

  return (
    <main>
      <h1>Espace d'administration</h1>
      <p style={{ color: '#4b5563' }}>
        Cet espace est réservé aux administrateurs. Des fonctionnalités avancées pourront être
        ajoutées ici (export, suivi des contrôles, gestion des comptes, etc.).
      </p>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>Statistiques rapides</h2>
        <ul>
          <li>Nombre total d'outils suivis : {tools.length}</li>
          <li>Comptes actifs : 2 (admin et technicien par défaut)</li>
          <li>Dernière connexion : {new Date().toLocaleString('fr-FR')}</li>
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ marginTop: 0 }}>Rappels</h2>
        <ul style={{ color: '#6b7280' }}>
          <li>Les techniciens n'accèdent qu'aux sections Common et Scan.</li>
          <li>Le hash unique reste caché des vues publiques et est uniquement utilisé pour le lien QR.</li>
          <li>Les fichiers de données se trouvent dans le répertoire <code>data/</code>.</li>
        </ul>
      </section>

      <p style={{ marginTop: 32, fontStyle: 'italic', color: '#6b7280' }}>
        Connecté en tant que {session.name ?? session.email}. Vous pouvez ajouter de nouveaux
        comptes ou outils en modifiant les fichiers JSON ou en branchant une base de données plus
        complète ultérieurement.
      </p>
    </main>
  );
}
