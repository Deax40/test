import LoginForm from '@/app/logging/login-form.jsx';

export const metadata = {
  title: 'Connexion',
};

export default async function LoggingPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl =
    typeof resolvedSearchParams?.callbackUrl === 'string' ? resolvedSearchParams.callbackUrl : '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Authentification</h1>
        <p style={{ margin: 0, color: '#475569' }}>
          Connectez-vous pour accéder aux modules sécurisés de suivi des outils. Les accès sont limités en fonction de votre
          rôle.
        </p>
      </header>

      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
