import LoginForm from '@/app/logging/login-form.jsx';

export const metadata = {
  title: 'Connexion',
};

export default async function LoggingPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  let callbackUrl = '/';
  if (resolvedSearchParams) {
    if (typeof resolvedSearchParams.get === 'function') {
      const paramValue = resolvedSearchParams.get('callbackUrl');
      if (typeof paramValue === 'string' && paramValue.length > 0) {
        callbackUrl = paramValue;
      }
    } else if (typeof resolvedSearchParams.callbackUrl === 'string' && resolvedSearchParams.callbackUrl.length > 0) {
      callbackUrl = resolvedSearchParams.callbackUrl;
    } else if (
      Array.isArray(resolvedSearchParams.callbackUrl) &&
      resolvedSearchParams.callbackUrl.length > 0 &&
      typeof resolvedSearchParams.callbackUrl[0] === 'string'
    ) {
      callbackUrl = resolvedSearchParams.callbackUrl[0];
    }
  }

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
