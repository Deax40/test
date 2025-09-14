'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Nav from '../../components/nav'
import { COMMUN_TOOLS } from '../../lib/commun-tools'

export default function CommunPage() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  const initialTools = COMMUN_TOOLS.map(t => ({
    name: t.name,
    lieu: '',
    etat: '',
    lastScanAt: '',
    lastScanUser: '',
    poids: '',
    imo: ''
  }))

  const [tools, setTools] = useState(initialTools)
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  const TAGS = ['Vizous Paris', 'Tanger', 'Tunisie', 'Gleizé']

  const normalize = s =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const toolsWithTags = tools.map(t => ({
    ...t,
    tags: TAGS.filter(tag =>
      normalize(`${t.name} ${t.lieu}`).includes(normalize(tag))
    )
  }))

  const results = toolsWithTags.filter(t => {
    const txt = normalize([
      t.name,
      t.lieu,
      t.etat,
      t.lastScanUser,
      t.imo
    ].filter(Boolean).join(' '))
    if (query && !txt.includes(normalize(query))) return false
    if (tagFilter && !t.tags.includes(tagFilter)) return false
    return true
  })

  const updateTool = (idx, field, value) => {
    setTools(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const format = v => (v && String(v).trim() !== '' ? v : '-')
  const formatDate = d => (d ? new Date(d).toLocaleString('fr-FR') : '-')
  const stateClass = etat => {
    switch (etat) {
      case 'RAS':
        return 'bg-green-200 text-green-800'
      case 'PROBLEME':
        return 'bg-red-200 text-red-800'
      case 'MAINTENANCE':
        return 'bg-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }

  return (
    <div>
      <Nav active="commun" />
      <div className="card">
        <h1 className="text-lg font-semibold mb-4">Outils Commun</h1>
        <input
          className="input mb-4"
          placeholder="Recherche..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag}
              className={`px-2 py-1 text-xs rounded-full border ${
                tagFilter === tag
                  ? 'bg-gray-200 border-gray-400'
                  : 'bg-gray-100 border-gray-300'
              }`}
              onClick={() =>
                setTagFilter(tagFilter === tag ? '' : tag)
              }
            >
              {tag}
            </button>
          ))}
        </div>
        {results.map((t, i) => (
          <details key={t.name} className="mb-2 border rounded">
            <summary className="cursor-pointer select-none p-2">
              {t.name}
            </summary>
            <div className="p-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Nom</label>
                {isAdmin ? (
                  <input
                    className="input"
                    value={t.name}
                    onChange={e => updateTool(i, 'name', e.target.value)}
                  />
                ) : (
                  <p>{t.name}</p>
                )}
              </div>
              <div>
                <label className="label">Lieu</label>
                {isAdmin ? (
                  <input
                    className="input"
                    value={t.lieu}
                    onChange={e => updateTool(i, 'lieu', e.target.value)}
                  />
                ) : (
                  <p>{format(t.lieu)}</p>
                )}
              </div>
              <div>
                <label className="label">État</label>
                {isAdmin ? (
                  <select
                    className="input"
                    value={t.etat}
                    onChange={e => updateTool(i, 'etat', e.target.value)}
                  >
                    <option value="">-</option>
                    <option value="RAS">RAS</option>
                    <option value="PROBLEME">Problème</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                ) : (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${stateClass(
                      t.etat
                    )}`}
                  >
                    {format(t.etat)}
                  </span>
                )}
              </div>
              <div>
                <label className="label">Dernier scan</label>
                {isAdmin ? (
                  <input
                    type="datetime-local"
                    className="input"
                    value={t.lastScanAt}
                    onChange={e => updateTool(i, 'lastScanAt', e.target.value)}
                  />
                ) : (
                  <p>{formatDate(t.lastScanAt)}</p>
                )}
              </div>
              <div>
                <label className="label">Utilisateur</label>
                {isAdmin ? (
                  <input
                    className="input"
                    value={t.lastScanUser}
                    onChange={e =>
                      updateTool(i, 'lastScanUser', e.target.value)
                    }
                  />
                ) : (
                  <p>{format(t.lastScanUser)}</p>
                )}
              </div>
              <div>
                <label className="label">Poids</label>
                {isAdmin ? (
                  <input
                    className="input"
                    value={t.poids}
                    onChange={e => updateTool(i, 'poids', e.target.value)}
                  />
                ) : (
                  <p>{format(t.poids)}</p>
                )}
              </div>
              <div>
                <label className="label">Numéro IMO</label>
                {isAdmin ? (
                  <input
                    className="input"
                    value={t.imo}
                    onChange={e => updateTool(i, 'imo', e.target.value)}
                  />
                ) : (
                  <p>{format(t.imo)}</p>
                )}
              </div>
            </div>
            {t.tags.length > 0 && (
              <div className="p-3 pt-0 space-x-1">
                {t.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-200 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </details>
        ))}
        {results.length === 0 && (
          <p className="text-sm text-gray-500">Aucun outil</p>
        )}
      </div>
    </div>
  )
}

