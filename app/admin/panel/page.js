import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import Link from 'next/link'
import DeleteButton from './delete-button'
import AddAdminForm from './add-admin'

async function getData() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'asc' }, // oldest to newest as requested
    include: { createdBy: { select: { username: true, name: true } } }
  })
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, username: true, name: true, createdAt: true }
  })
  return { logs, admins }
}

export default async function AdminPanelPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="card">
        <p>Accès refusé. <Link className="underline" href="/admin">Se connecter</Link></p>
      </div>
    )
  }
  const { logs, admins } = await getData()

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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-sm">{new Date(log.date).toLocaleString('fr-FR')}</td>
                  <td className="px-3 py-2 text-sm max-w-[300px] truncate" title={log.qrData}>{log.qrData}</td>
                  <td className="px-3 py-2 text-sm">{log.lieu}</td>
                  <td className="px-3 py-2 text-sm">{log.actorName} ({log.createdBy?.username || '—'})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Gestion des administrateurs</h2>
        <AddAdminForm />
          <div>
            <label className="label">Nom</label>
            <input className="input" name="name" placeholder="Nom complet" required />
          </div>
          <div>
            <label className="label">Nom d'utilisateur</label>
            <input className="input" name="username" placeholder="adminX" required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" name="password" placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary">Ajouter</button>
        <p className="text-xs text-gray-500 mt-2">Seuls les comptes ADMIN peuvent ajouter/supprimer des administrateurs.</p>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Administrateurs existants</h3>
          <ul className="divide-y divide-gray-200 rounded-xl border">
            {admins.map(a => (
              <li key={a.id} className="flex items-center justify-between p-3">
                <div className="text-sm">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-gray-500">@{a.username} • créé le {new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <DeleteButton id={a.id} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
