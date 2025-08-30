'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'
import ToolForm from '../../components/tool-form'

const tools = [
  'Jeu 1 Care Control Chauffe Paris',
  'Jeu 2 Care Control Chauffe Lyon',
  'Jeu 3 Care Control Chauffe Marseille'
]

export default function CarePage() {
  const { status } = useSession()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  const results = tools.filter(t => t.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <Nav active="care" />
      <div className="card">
        <input className="input mb-4" placeholder="Rechercher..." value={query} onChange={e=>setQuery(e.target.value)} />
        <ul className="divide-y">
          {results.map((t, i) => (
            <li key={i}>
              <button className="w-full p-2 text-left hover:bg-gray-50" onClick={() => setSelected(t)}>{t}</button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-2 text-sm text-gray-500">Aucun résultat</li>
          )}
        </ul>
        {selected && <ToolForm tool={selected} />}
      </div>
    </div>
  )
}
