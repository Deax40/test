import RoleGuard from '@/components/RoleGuard.jsx';
import { ROLES } from '@/lib/role-context.jsx';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <RoleGuard allowed={[ROLES.ADMIN]}>
      <div className="section-card">
        <h1>Espace d’administration</h1>
        <p>
          Cette zone sera complétée ultérieurement pour offrir des fonctionnalités de gestion avancées
          (suivi des stocks, gestion des QR codes, reporting, etc.).
        </p>
        <p className="notice">
          Actuellement, seuls les utilisateurs <strong>Admin</strong> peuvent accéder à cette page. Les techniciens sont
          automatiquement redirigés vers la base Common.
        </p>
      </div>
    </RoleGuard>
  );
}
