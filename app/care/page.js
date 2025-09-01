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
  const [selected, setSelected] = useState('')
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
        <input
          className="input mb-4"
          placeholder="Rechercher..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setSelected('')
          }}
        />
        <select
          className="input mb-4"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Sélectionner...</option>
          {results.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {selected && (
          <ToolForm tool={tools.find(t => t.id === selected)?.name || ''} />
        )}
        {results.length === 0 && (
          <p className="p-2 text-sm text-gray-500">Aucun résultat</p>
        )}
      </div>
    </div>
  )
}
