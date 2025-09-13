'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'

export default function CommunPage() {
  const { status } = useSession()
  const [query, setQuery] = useState('')
  const [tools, setTools] = useState([])
  const [openFilters, setOpenFilters] = useState(false)
  const [etat, setEtat] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [operateur, setOperateur] = useState('')
  const [lieu, setLieu] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  useEffect(() => {
    const fetchTools = () => {
      fetch('/api/tools?category=COMMUN')
        .then(r => r.json())
        .then(d => setTools(d.tools))
    }
    fetchTools()
    const id = setInterval(fetchTools, 5000)
    return () => clearInterval(id)
  }, [])
  const TAGS = ['Vizous Paris', 'Tanger', 'Tunisie', 'Gleizé']
  const normalize = s =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  const toolsWithTags = tools.map(t => {
    const text = normalize(
      [t.name, t.lastScanUser, t.lastScanLieu, t.lastScanEtat].filter(Boolean).join(' ')
    )
    return {
      ...t,
      tags: TAGS.filter(tag => text.includes(normalize(tag)))
    }
  })

  const results = toolsWithTags.filter(t => {
    const txt = normalize(
      [t.name, t.lastScanUser, t.lastScanLieu, t.lastScanEtat].filter(Boolean).join(' ')
    )
    if (query && !txt.includes(normalize(query))) return false
    if (etat && normalize(t.lastScanEtat) !== normalize(etat)) return false
    if (operateur && !normalize(t.lastScanUser).includes(normalize(operateur))) return false
    if (lieu && !normalize(t.lastScanLieu).includes(normalize(lieu))) return false
    if (dateDebut && t.lastScanAt && new Date(t.lastScanAt) < new Date(dateDebut)) return false
    if (dateFin && t.lastScanAt && new Date(t.lastScanAt) > new Date(dateFin)) return false
    if (tagFilter && !t.tags.includes(tagFilter)) return false
    return true
  })

  const format = v => (v && String(v).trim() !== '' ? v : '-')
  const formatDate = d => (d ? new Date(d).toLocaleString('fr-FR') : '-')

  const resetFilters = () => {
    setQuery('')
    setEtat('')
    setDateDebut('')
    setDateFin('')
    setOperateur('')
    setLieu('')
    setTagFilter('')
  }

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Find Commun Tool</h1>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className="btn" onClick={() => setOpenFilters(!openFilters)}>
            Filtrer
          </button>
          {TAGS.map(tag => (
            <button
              key={tag}
              className={`px-2 py-1 text-xs rounded-full border ${
                tagFilter === tag ? 'bg-gray-200 border-gray-400' : 'bg-gray-100 border-gray-300'
              }`}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
            >
              {tag}
            </button>
          ))}
          <button className="btn ml-auto" onClick={resetFilters}>
            Réinitialiser filtres
          </button>
        </div>
        {openFilters && (
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <input
              className="input"
              placeholder="Recherche..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select className="input" value={etat} onChange={e => setEtat(e.target.value)}>
              <option value="">État</option>
              <option value="RAS">RAS</option>
              <option value="PROBLEME">Problème</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <input
              type="text"
              className="input"
              placeholder="Opérateur"
              value={operateur}
              onChange={e => setOperateur(e.target.value)}
            />
            <input
              type="text"
              className="input"
              placeholder="Lieu"
              value={lieu}
              onChange={e => setLieu(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
            />
          </div>
        )}
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Outil</th>
              <th className="text-left p-2">Dernier scan</th>
              <th className="text-left p-2">Utilisateur</th>
              <th className="text-left p-2">Lieu</th>
              <th className="text-left p-2">État</th>
              <th className="text-left p-2">Tags</th>
            </tr>
          </thead>
          <tbody>
            {results.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.name}</td>
                <td className="p-2">{formatDate(t.lastScanAt)}</td>
                <td className="p-2">{format(t.lastScanUser)}</td>
                <td className="p-2">{format(t.lastScanLieu)}</td>
                <td className="p-2">{format(t.lastScanEtat)}</td>
                <td className="p-2 space-x-1">
                  {t.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-200 rounded-full">
                      {tag}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={6} className="p-2 text-sm text-gray-500">Aucun résultat</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
