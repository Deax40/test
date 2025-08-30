import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import Link from 'next/link'
import DeleteButton from './delete-button'
import AddUserForm from './add-user'

async function getData() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      qrData: true,
      lieu: true,
      date: true,
      actorName: true,
      etat: true,
      photoType: true,
      createdBy: { select: { username: true, name: true } }
    }
  })
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })
  return { logs, users }
}

export default async function AdminPanelPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="card">
        <p>Accès refusé. <Link className="underline" href="/">Se connecter</Link></p>
      </div>
    )
  }
  const { logs, users } = await getData()

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Journal des scans (du plus ancien au plus récent)</h2>
          <a className="btn" href="/api/auth/signout">Se déconnecter</a>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">QR</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Lieu</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Technicien</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">État</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-sm">{new Date(log.date).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 text-sm max-w-[300px] truncate" title={log.qrData}>{log.qrData}</td>
                  <td className="px-3 py-2 text-sm">{log.lieu}</td>
                  <td className="px-3 py-2 text-sm">{log.actorName} ({log.createdBy?.username || '—'})</td>
                  <td className="px-3 py-2 text-sm">{log.etat === 'ENDOMMAGE' ? 'Endommagé' : 'Correct'}</td>
                  <td className="px-3 py-2 text-sm">
                    {log.photoType ? (
                      <a
                        className="underline"
                        href={`/api/logs/${log.id}/photo`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Voir
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h2>
        <AddUserForm />
        <p className="text-xs text-gray-500 mt-2">Seuls les comptes ADMIN peuvent ajouter/supprimer des utilisateurs.</p>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Utilisateurs existants</h3>
          <ul className="divide-y divide-gray-200 rounded-xl border">
            {users.map(u => (
              <li key={u.id} className="flex items-center justify-between p-3">
                <div className="text-sm">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-gray-500">
                    @{u.username} • {u.email || '—'} • {u.role === 'ADMIN' ? 'Admin' : 'Tech'} • créé le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <DeleteButton id={u.id} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
