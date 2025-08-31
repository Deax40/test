'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'
import ToolForm from '../../components/tool-form'

const extraTools = [
  'Care Capteur pression matière Silicone 43CH002505',
  'Jeu 1 Care Control Chauffe Paris',
  'Jeu 1 Care Extension de Colonne Paris',
  'Jeu 1 Care Four flucke Paris',
  'Jeu 1 Care Mesure de Pression Paris',
  'Jeu 2 Care Chauffe Paris',
  'Jeu 2 Care Mesure de Pression Paris',
  'Jeu 2 Care Pression matière Paris',
  'Jeu 3 Care Chauffe Gleizé',
  'Jeu 3 Care Extension de Colonne Gleizé',
  'Jeu 3 Care Four flucke Gleizé',
  'Jeu 3 Care Pression matière Gleizé',
  'Jeu 4 Care Chauffe Gleizé',
  'Jeu 4 Care Extension de Colonne Gleizé',
  'Jeu 4 Care Pression matière Gleizé'
]

export default function CarePage() {
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
    fetch('/api/tools?category=CARE').then(r => r.json()).then(d => {
      const extras = extraTools.map((name, idx) => ({ id: `extra-${idx}`, name }))
      const merged = [...d.tools, ...extras].sort((a, b) => a.name.localeCompare(b.name))
      setTools(merged)
    })
  }, [])

  const results = tools.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div>
      <Nav active="care" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Find Care Tool</h1>
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
