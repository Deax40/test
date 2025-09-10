'use client'
import { useState, useEffect } from 'react'

export default function UserHabilitations({ userId }) {
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState(null)
  const [habilitations, setHabilitations] = useState([])

  useEffect(() => {
    fetch(`/api/habilitations?userId=${userId}`)
      .then(r => r.json())
      .then(d => setHabilitations(d.habilitations))
  }, [userId])

  async function onSubmit(e) {
    e.preventDefault()
    const form = new FormData()
    form.append('userId', userId)
    form.append('expiresAt', expiresAt)
    if (file) form.append('file', file)
    await fetch('/api/admin/habilitations', { method: 'POST', body: form })
    setExpiresAt('')
    setFile(null)
    const d = await fetch(`/api/habilitations?userId=${userId}`).then(r=>r.json())
    setHabilitations(d.habilitations)
  }

  async function onDelete(id) {
    await fetch(`/api/admin/habilitations/${id}`, { method: 'DELETE' })
    setHabilitations(habilitations.filter(h => h.id !== id))
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-2">Habilitations</h4>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3 items-end mb-4">
        <input type="date" className="input" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} required />
        <input type="file" accept="application/pdf" className="input" onChange={e=>setFile(e.target.files?.[0] || null)} required />
        <button className="btn btn-success">Ajouter</button>
      </form>
      <ul className="divide-y divide-gray-200 rounded-xl border">
        {habilitations.map(h => (
          <li key={h.id} className="flex items-center justify-between p-3 text-sm">
            <a
              className="underline"
              href={`/api/habilitations/${h.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {h.filePath.split('/').pop()}
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">exp. {new Date(h.expiresAt).toLocaleDateString('fr-FR')}</span>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(h.id)}>Supprimer</button>
            </div>
          </li>
        ))}
        {habilitations.length === 0 && <li className="p-3 text-sm">Aucune habilitation.</li>}
      </ul>
    </div>
  )
}

