'use client'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import ExpiringHabilitationAlert from './expiring-habilitation-alert'

export default function Nav({ active }) {
  const { data: session } = useSession()
  return (
    <nav className="mb-6 flex flex-col gap-2 p-3 rounded-xl header-bar sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Link href="/scan" className={`btn ${active === 'scan' ? 'btn-primary' : ''}`}>SCAN</Link>
        <Link href="/care" className={`btn ${active === 'care' ? 'btn-primary' : ''}`}>CARE</Link>
        <Link href="/commun" className={`btn ${active === 'commun' ? 'btn-primary' : ''}`}>COMMUN</Link>
        {session?.user?.role === 'ADMIN' && (
          <>
            <Link
              href="/admin/panel"
              className={`btn ${active === 'admin' ? 'btn-primary' : ''}`}
            >
              ADMIN
            </Link>
            <Link
              href="/admin/revision"
              className={`btn ${active === 'revision' ? 'btn-primary' : ''}`}
            >
              RÉVISION
            </Link>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href="/compte"
          className={`btn flex items-center gap-1 ${active === 'compte' ? 'btn-primary' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>
          {session?.user?.name || 'Mon compte'}
        </Link>
        <button className="btn w-full sm:w-auto" onClick={() => signOut({ callbackUrl: '/' })}>Se déconnecter</button>
      </div>
      <ExpiringHabilitationAlert />
    </nav>
  )
}
