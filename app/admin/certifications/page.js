import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import Link from 'next/link'
import Nav from '../../../components/nav'
import ManageCertifications from '../panel/manage-certifications'

export default async function CertificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return (
      <div className="card">
        <p>Accès refusé. <Link className="underline" href="/">Se connecter</Link></p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Nav active="certifications" />
      <div className="card">
        <h2 className="text-lg font-semibold">Gestion des certifications</h2>
        <div className="mt-2">
          <ManageCertifications />
        </div>
      </div>
    </div>
  )
}
