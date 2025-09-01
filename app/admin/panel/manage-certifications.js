'use client'
import { useEffect, useState } from 'react'

export default function ManageCertifications() {
  const [tools, setTools] = useState([])
  const [certs, setCerts] = useState([])
  const [category, setCategory] = useState('CARE')
  const [toolId, setToolId] = useState('')
  const [months, setMonths] = useState(12)
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')

  async function load(cat = category) {
    try {
      const toolsRes = await fetch(`/api/tools?category=${cat}`, { cache: 'no-store' })
      if (!toolsRes.ok) throw new Error('tools')
      const toolsData = await toolsRes.json()
      setTools(toolsData.tools || [])

      const certRes = await fetch('/api/certifications', { cache: 'no-store' })
      if (!certRes.ok) throw new Error('certs')
      const certData = await certRes.json()
      setCerts(certData.certifications || [])
    } catch (e) {
      setTools([])
      setCerts([])
    }
  }
  useEffect(() => {
    setToolId('')
    load(category)
  }, [category])

  async function addCert(e) {
    e.preventDefault()
    setMsg('')
    const fd = new FormData()
    fd.append('toolId', toolId)
    fd.append('months', months)
    if (file) fd.append('file', file)
    const res = await fetch('/api/certifications', { method: 'POST', body: fd })
    if (res.ok) {
      setToolId('')
      setMonths(12)
      setFile(null)
      load(category)
    } else {
      setMsg('Erreur lors de l\'ajout')
    }
  }

  async function remove(id) {
    if (!confirm('Supprimer ce certificat ?')) return
    await fetch(`/api/certifications/${id}`, { method: 'DELETE' })
    load(category)
  }

  return (
    <div>
      <form onSubmit={addCert} className="grid gap-3 md:grid-cols-6 items-end">
        <div>
          <label className="label">Catégorie</label>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="CARE">Care</option>
            <option value="COMMUN">Commun</option>
          </select>
        </div>
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
          <label className="label">Durée (mois)</label>
          <input type="number" min="1" className="input" value={months} onChange={e=>setMonths(e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="label">Fichier</label>
          <input type="file" className="input" onChange={e=>setFile(e.target.files[0])} required />
        </div>
        <button className="btn btn-success">Ajouter</button>
      </form>
      {msg && <p className="text-sm mt-2">{msg}</p>}

      <div className="mt-6">
        <ul className="divide-y divide-gray-200 rounded-xl border">
          {certs.map(c => (
            <li key={c.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                {c.tool.name} • expire le {new Date(c.expiresAt).toLocaleDateString('fr-FR')}
              </div>
              <div className="flex items-center space-x-2">
                <a className="underline" href={`/api/certifications/${c.id}`} target="_blank">Voir</a>
                <button className="btn btn-danger px-2 py-1 text-xs" onClick={() => remove(c.id)}>Supprimer</button>
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
