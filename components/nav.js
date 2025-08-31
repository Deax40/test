'use client'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export default function Nav({ active }) {
  const { data: session } = useSession()
  return (
    <nav className="mb-6 flex items-center justify-between p-3 rounded-xl header-bar">
      <div className="flex gap-4">
        <Link href="/scan" className={active === 'scan' ? 'font-semibold' : ''}>SCAN</Link>
        <Link href="/care" className={active === 'care' ? 'font-semibold' : ''}>CARE</Link>
        <Link href="/commun" className={active === 'commun' ? 'font-semibold' : ''}>COMMUN</Link>
        {session?.user?.role === 'ADMIN' && (
          <Link href="/admin/panel" className={active === 'admin' ? 'font-semibold' : ''}>ADMIN</Link>
        )}
      </div>
      <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>Se déconnecter</button>
    </nav>
  )
}
