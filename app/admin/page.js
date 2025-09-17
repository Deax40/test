import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Nav from '@/components/nav'
import { authOptions } from '@/lib/auth'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/scan')
  }

  return (
    <div className="space-y-6">
      <Nav active="admin" />
      <div className="card">
        <h1 className="text-2xl font-semibold mb-2">Administration</h1>
        <p className="text-sm text-gray-600">
          Cette page sera utilisée prochainement pour les fonctionnalités d'administration.
        </p>
      </div>
    </div>
  )
}
