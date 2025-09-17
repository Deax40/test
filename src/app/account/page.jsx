import { changePasswordAction, updateProfileAction } from '@/app/actions/auth.js';
import { requireUser } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

function formatDate(date) {
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

function getStatusMessage(code) {
  switch (code) {
    case 'profile-updated':
      return { tone: 'success', message: 'Profil mis à jour.' };
    case 'password-updated':
      return { tone: 'success', message: 'Mot de passe mis à jour avec succès.' };
    default:
      return null;
  }
}

function getErrorMessage(code) {
  switch (code) {
    case 'missing-fields':
      return 'Tous les champs sont obligatoires.';
    case 'password-too-short':
      return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
    case 'password-mismatch':
      return 'Les mots de passe ne correspondent pas.';
    case 'invalid-current-password':
      return 'Le mot de passe actuel est incorrect.';
    default:
      return null;
  }
}

export default async function AccountPage({ searchParams }) {
  const user = await requireUser();
  const status = getStatusMessage(searchParams?.status);
  const error = getErrorMessage(searchParams?.error);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Mon compte</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Consultez et mettez à jour vos informations personnelles. Les rôles sont gérés par l&apos;équipe administrative.
        </p>
      </section>

      {status && (
        <div style={{ ...alertStyle, background: '#dcfce7', color: '#166534', borderColor: '#22c55e' }}>{status.message}</div>
      )}
      {error && (
        <div style={{ ...alertStyle, background: '#fee2e2', color: '#b91c1c', borderColor: '#ef4444' }}>{error}</div>
      )}

      <section
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Informations</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', rowGap: 8, columnGap: 16, margin: 0 }}>
            <dt style={dtStyle}>Nom</dt>
            <dd style={ddStyle}>{user.name ?? '—'}</dd>
            <dt style={dtStyle}>E-mail</dt>
            <dd style={ddStyle}>{user.email}</dd>
            <dt style={dtStyle}>Rôle</dt>
            <dd style={ddStyle}>{user.role === 'ADMIN' ? 'Administrateur' : 'Technicien'}</dd>
            <dt style={dtStyle}>Compte créé</dt>
            <dd style={ddStyle}>{formatDate(user.createdAt)}</dd>
            <dt style={dtStyle}>Dernière mise à jour</dt>
            <dd style={ddStyle}>{formatDate(user.updatedAt)}</dd>
          </dl>
        </article>

        <article style={cardStyle}>
          <h2 style={cardTitleStyle}>Modifier mon profil</h2>
          <form action={updateProfileAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Nom affiché</span>
              <input name="name" defaultValue={user.name ?? ''} style={inputStyle} placeholder="Votre nom" />
            </label>
            <button type="submit" style={primaryButtonStyle}>
              Enregistrer
            </button>
          </form>
        </article>

        <article style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h2 style={cardTitleStyle}>Modifier mon mot de passe</h2>
          <form action={changePasswordAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Mot de passe actuel</span>
              <input type="password" name="currentPassword" required style={inputStyle} autoComplete="current-password" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Nouveau mot de passe</span>
              <input type="password" name="newPassword" required style={inputStyle} autoComplete="new-password" minLength={8} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Confirmer le nouveau mot de passe</span>
              <input type="password" name="confirmPassword" required style={inputStyle} autoComplete="new-password" minLength={8} />
            </label>
            <button type="submit" style={primaryButtonStyle}>
              Mettre à jour le mot de passe
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}

const alertStyle = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid',
  fontWeight: 500,
};

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 24,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: 'white',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '1.1rem',
};

const dtStyle = {
  margin: 0,
  color: '#6b7280',
  fontWeight: 500,
};

const ddStyle = {
  margin: 0,
  fontWeight: 600,
  color: '#0f172a',
};

const inputStyle = {
  borderRadius: 10,
  border: '1px solid #cbd5f5',
  padding: '10px 12px',
  fontSize: '1rem',
};

const primaryButtonStyle = {
  alignSelf: 'flex-start',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontWeight: 600,
  cursor: 'pointer',
};
