import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import Link from 'next/link'
import DeleteButton from './delete-button'
import AddUserForm from './add-user'
import EditUserForm from './edit-user'
import Nav from '../../../components/nav'

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
      probleme: true,
      photoType: true,
      createdBy: { select: { username: true, name: true } }
    }
  })
  const toolLogs = await prisma.toolLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      tool: true,
      status: true,
      lieu: true,
      client: true,
      etat: true,
      transporteur: true,
      tracking: true,
      createdAt: true,
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
  return { logs, toolLogs, users }
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
  const { logs, toolLogs, users } = await getData()

  return (
    <div className="space-y-8">
      <Nav active="admin" />
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Journal des scans (du plus ancien au plus récent)</h2>
        <div className="mb-4">
          <p className="text-xs text-gray-500">Le journal est remis à zéro après 7 scans.</p>
          <p className="text-xs text-gray-500 mt-1">Voulez-vous enregistrer la base en Excel ou TXT ?</p>
          <div className="mt-2 space-x-2">
            <a className="btn px-3 py-1 text-sm" href="/api/logs?format=csv" target="_blank" rel="noopener noreferrer">Excel</a>
            <a className="btn px-3 py-1 text-sm" href="/api/logs?format=txt" target="_blank" rel="noopener noreferrer">TXT</a>
          </div>
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
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Problème</th>
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
                  <td className="px-3 py-2 text-sm">{log.etat === 'PROBLEME' ? 'Problème' : 'RAS'}</td>
                  <td className="px-3 py-2 text-sm">{log.probleme || '—'}</td>
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
        <h2 className="text-lg font-semibold mb-2">Journal des outils</h2>
        <div className="mb-4">
          <p className="text-xs text-gray-500">Le journal est remis à zéro après 10 scans.</p>
          <p className="text-xs text-gray-500 mt-1">Voulez-vous enregistrer la base en Excel ou TXT ?</p>
          <div className="mt-2 space-x-2">
            <a className="btn px-3 py-1 text-sm" href="/api/tool-logs?format=csv" target="_blank" rel="noopener noreferrer">Excel</a>
            <a className="btn px-3 py-1 text-sm" href="/api/tool-logs?format=txt" target="_blank" rel="noopener noreferrer">TXT</a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Outil</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Client</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Lieu</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Transporteur</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tracking</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Technicien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {toolLogs.map(log => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-sm">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 text-sm">{log.tool}</td>
                  <td className="px-3 py-2 text-sm">{log.status}</td>
                  <td className="px-3 py-2 text-sm">{log.client || '—'}</td>
                  <td className="px-3 py-2 text-sm">{log.lieu || '—'}</td>
                  <td className="px-3 py-2 text-sm">{log.transporteur || '—'}</td>
                  <td className="px-3 py-2 text-sm">{log.tracking || '—'}</td>
                  <td className="px-3 py-2 text-sm">{log.createdBy?.name} ({log.createdBy?.username || '—'})</td>
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
                <div className="flex items-center">
                  <EditUserForm user={u} />
                  <DeleteButton id={u.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
