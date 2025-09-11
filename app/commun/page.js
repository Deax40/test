'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'

export default function CommunPage() {
  const { status } = useSession()
  const [query, setQuery] = useState('')
  const [tools, setTools] = useState([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  useEffect(() => {
    fetch('/api/tools?category=COMMUN').then(r => r.json()).then(d => setTools(d.tools))
  }, [])

  const results = tools.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Find Commun Tool</h1>
        <input className="input mb-4" placeholder="Rechercher..." value={query} onChange={e=>setQuery(e.target.value)} />
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Outil</th>
              <th className="text-left p-2">Dernier scan</th>
              <th className="text-left p-2">Utilisateur</th>
              <th className="text-left p-2">Lieu</th>
            </tr>
          </thead>
          <tbody>
            {results.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{t.lastScanAt ? new Date(t.lastScanAt).toLocaleString('fr-FR') : '-'}</td>
                <td className="p-2">{t.lastScanUser || '-'}</td>
                <td className="p-2">{t.lastScanLieu || '-'}</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={4} className="p-2 text-sm text-gray-500">Aucun résultat</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
