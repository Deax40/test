'use client'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function Nav({ active }) {
  const { data: session } = useSession()
  return (
    <nav className="mb-6 flex flex-col gap-2 p-3 rounded-xl header-bar sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Link href="/scan" className={`btn ${active === 'scan' ? 'btn-primary' : ''}`}>SCAN</Link>
        <Link href="/care" className={`btn ${active === 'care' ? 'btn-primary' : ''}`}>CARE</Link>
        <Link href="/commun" className={`btn ${active === 'commun' ? 'btn-primary' : ''}`}>COMMUN</Link>
        {session?.user?.role === 'ADMIN' && (
          <Link
            href="/admin/panel"
            className={`btn ${active === 'admin' ? 'btn-primary' : ''}`}
          >
            ADMIN
          </Link>
        )}
      </div>
      <button className="btn w-full sm:w-auto" onClick={() => signOut({ callbackUrl: '/' })}>Se déconnecter</button>
    </nav>
  )
}
