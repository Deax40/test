'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'
import ToolForm from '../../components/tool-form'

export default function CommunPage() {
  const { status } = useSession()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
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
        <ul className="divide-y">
          {results.map(t => (
            <li key={t.id}>
              <button
                className="w-full p-2 text-left hover:bg-gray-50"
                onClick={() => setSelected(selected === t.id ? null : t.id)}
              >
                {t.name}
              </button>
              {selected === t.id && <ToolForm tool={t.name} />}
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-2 text-sm text-gray-500">Aucun résultat</li>
          )}
        </ul>
      </div>
    </div>
  )
}
