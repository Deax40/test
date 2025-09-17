import { prisma } from '@/lib/db.js';
import { requireUser } from '@/lib/session.js';
import ProfilePasswordForm from '@/app/profile/profile-password-form.jsx';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUser(['ADMIN', 'TECH']);
  const scanCount = await prisma.toolHistory.count({ where: { performedById: user.id } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Mon profil</h1>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <ProfileBadge label="Identité" value={user.name ?? '—'} />
          <ProfileBadge label="Email" value={user.email} />
          <ProfileBadge label="Rôle" value={user.role} />
          <ProfileBadge
            label="Compte créé"
            value={new Date(user.createdAt).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <ProfileBadge label="Actions enregistrées" value={scanCount} />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Changer mon mot de passe</h2>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
          Le mot de passe doit comporter au minimum 8 caractères, dont une lettre, un chiffre et un caractère spécial.
        </p>
        <ProfilePasswordForm />
      </section>
    </div>
  );
}

function ProfileBadge({ label, value }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 16,
        border: '1px solid rgba(148, 163, 184, 0.3)',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
    </div>
  );
}
