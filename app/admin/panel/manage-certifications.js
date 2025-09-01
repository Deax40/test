'use client'

import { useEffect, useState } from 'react'

export default function ManageCertifications() {
  const [tools, setTools] = useState([])
  const [certs, setCerts] = useState([])
  const [toolId, setToolId] = useState('')
  const [revisionDate, setRevisionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const toolsRes = await fetch(`/api/tools?category=CARE`, { cache: 'no-store' })
      if (!toolsRes.ok) throw new Error('tools')
      const toolsData = await toolsRes.json()
      const toolsList = Array.isArray(toolsData.tools) ? toolsData.tools : []
      setTools(toolsList)
    } catch (e) {
      setTools([])
    }
    try {
      const certRes = await fetch('/api/certifications', { cache: 'no-store' })
      if (!certRes.ok) throw new Error('certs')
      const certData = await certRes.json()
      setCerts(certData.certifications || [])
    } catch (e) {
      setCerts([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function addCert(e) {
    e.preventDefault()
    setMsg('')
    try {
      const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, revisionDate })
      })
      if (res.ok) {
        setToolId('')
        setRevisionDate(new Date().toISOString().split('T')[0])
        load()
      } else {
        const err = await res.text()
        setMsg(`Erreur lors de l'ajout: ${err}`)
      }
    } catch (e) {
      setMsg("Erreur lors de l'ajout")
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer ce certificat ?')) return
    await fetch(`/api/certifications/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        Sélectionnez un outil puis indiquez la date de sa prochaine révision. Une alerte rouge
        apparaîtra si la date de révision est dans moins de trois mois.
      </p>
      {certs.some(c => new Date(c.revisionDate) - new Date() < 1000 * 60 * 60 * 24 * 90) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Certains certificats arrivent à échéance dans moins de 3 mois.
        </div>
      )}
      <form onSubmit={addCert} className="grid gap-3 md:grid-cols-4 items-end">
        <div>
          <label className="label">Outil</label>
          <select
            className="input"
            value={toolId}
            onChange={e => setToolId(e.target.value)}
            required
            disabled={tools.length === 0}
          >
            <option value="" disabled>
              {tools.length === 0 ? 'Aucun outil disponible' : 'Sélectionner...'}
            </option>
            {tools.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Prochaine révision</label>
          <input
            type="date"
            className="input"
            value={revisionDate}
            onChange={e => setRevisionDate(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-success md:col-span-2">Ajouter</button>
      </form>
      {msg && <p className="text-sm mt-2">{msg}</p>}

      <div className="mt-6">
        <ul className="divide-y divide-gray-200 rounded-xl border">
          {certs.map(c => (
            <li key={c.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                {c.tool.name} • prochaine révision le {new Date(c.revisionDate).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="btn btn-danger px-2 py-1 text-xs"
                  onClick={() => remove(c.id)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
          {certs.length === 0 && (
            <li className="p-3 text-sm text-gray-500">Aucun certificat</li>
          )}
        </ul>
      </div>
    </div>
  )
}

