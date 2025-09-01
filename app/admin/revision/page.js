import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import Link from 'next/link'
import Nav from '../../../components/nav'
import MachinesRevision from './machines-revision'

export default async function RevisionPage() {
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
      <Nav active="revision" />
      <MachinesRevision />
    </div>
  )
}
