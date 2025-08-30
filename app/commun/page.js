'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'
import ToolForm from '../../components/tool-form'

const tools = [
  'Pompe Enerpac',
  'Rallonge micromètre intérieur contrôle fourreau',
  'Règle de niveau jeu 1 Gleizé',
  'Règle de niveau jeu 2 Gleizé',
  'Verin 30 cm Gleizé',
  'Visseuse electrique a choc Gleizé',
  'Visseuse pneumatique Gleizé',
  'Visseuse pneumatique Paris',
  'clef serre tube Gleizé',
  'clé dynamométrique Gleizé',
  'clé plate diam 70 Gleizé',
  'comparateur interieur pour contrôle fourreau',
  'douilles visseuse Gleizé',
  'jeux demontage vis a billes Gleizé',
  'jeux demontage vis a billes Gleizé',
  'kit changement codeur Baummeuler Gleizé',
  'pince a sertir Europam 67 Gleizé',
  'pince a sertir cosses 10-35',
  'testeur isolement Iso-tech Gleizé'
]

export default function CommunPage() {
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
      <Nav active="commun" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Find Commun Tool</h1>
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
