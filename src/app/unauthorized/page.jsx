import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function UnauthorizedPage() {
  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
      <h1>Accès refusé</h1>
      <p>Vous n'avez pas l'autorisation nécessaire pour accéder à cette page.</p>
      <p>
        <Link href="/common" style={{ color: '#2563eb' }}>
          Retour à la liste des outils
        </Link>{' '}
        ou{' '}
        <Link href="/login" style={{ color: '#2563eb' }}>
          reconnectez-vous avec un autre compte
        </Link>
        .
      </p>
    </main>
  );
}
