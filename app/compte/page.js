import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import Nav from '../../components/nav'
import ResetPasswordForm from './reset-password-form'
import Link from 'next/link'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return (
      <div className="card">
        <p>Accès refusé. <Link className="underline" href="/">Se connecter</Link></p>
      </div>
    )
  }
  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    include: {
      logs: { orderBy: { createdAt: 'desc' } },
      habilitations: { orderBy: { createdAt: 'desc' } }
    }
  })
  return (
    <div className="space-y-8">
      <Nav active="compte" />
      <h1 className="text-2xl font-bold text-center">Mon compte</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card shadow">
          <h2 className="text-lg font-semibold mb-2">Informations personnelles</h2>
          <p><strong>Nom:</strong> {user.name}</p>
          <p><strong>Nom d'utilisateur:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email || '—'}</p>
        </div>
        <div className="card shadow">
          <h2 className="text-lg font-semibold mb-2">Réinitialiser le mot de passe</h2>
          <ResetPasswordForm />
        </div>
      </div>
      <div className="card shadow">
        <h2 className="text-lg font-semibold mb-2">Mes scans</h2>
        <ul className="divide-y divide-gray-200">
          {user.logs.map(l => (
            <li key={l.id} className="p-2 text-sm flex justify-between">
              <span>{new Date(l.date).toLocaleString('fr-FR')} - {l.qrData}</span>
              <span>{l.lieu}</span>
            </li>
          ))}
          {user.logs.length === 0 && <li className="p-2 text-sm">Aucun scan.</li>}
        </ul>
      </div>
      <div className="card shadow">
        <h2 className="text-lg font-semibold mb-2">Habilitation personnelle</h2>
        <ul className="divide-y divide-gray-200">
            {user.habilitations.map(h => (
              <li key={h.id} className="p-2 text-sm flex justify-between">
                <a
                  className="underline"
                  href={`/api/habilitations/${h.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {h.filePath.split('/').pop()}
                </a>
                <span>exp. {new Date(h.expiresAt).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          {user.habilitations.length === 0 && <li className="p-2 text-sm">Aucune habilitation.</li>}
        </ul>
      </div>
    </div>
  )
}
