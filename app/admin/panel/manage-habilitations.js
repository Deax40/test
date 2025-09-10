'use client'
import { useState, useEffect } from 'react'

export default function ManageHabilitations({ users }) {
  const [selectedUser, setSelectedUser] = useState(users[0]?.id || '')
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState(null)
  const [habilitations, setHabilitations] = useState([])

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/habilitations?userId=${selectedUser}`)
        .then(r => r.json())
        .then(d => setHabilitations(d.habilitations))
    }
  }, [selectedUser])

  async function onSubmit(e) {
    e.preventDefault()
    const form = new FormData()
    form.append('userId', selectedUser)
    form.append('expiresAt', expiresAt)
    if (file) form.append('file', file)
    await fetch('/api/admin/habilitations', { method: 'POST', body: form })
    setExpiresAt('')
    setFile(null)
    const d = await fetch(`/api/habilitations?userId=${selectedUser}`).then(r=>r.json())
    setHabilitations(d.habilitations)
  }

  async function onDelete(id) {
    await fetch(`/api/admin/habilitations/${id}`, { method: 'DELETE' })
    setHabilitations(habilitations.filter(h => h.id !== id))
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4 items-end mb-4">
        <select className="input" value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
        </select>
        <input type="date" className="input" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} required />
        <input type="file" accept="application/pdf" className="input" onChange={e=>setFile(e.target.files?.[0] || null)} required />
        <button className="btn btn-success">Ajouter</button>
      </form>
      <ul className="divide-y divide-gray-200 rounded-xl border">
        {habilitations.map(h => (
          <li key={h.id} className="flex items-center justify-between p-3">
            <div className="text-sm">
              <a className="underline" href={h.filePath} target="_blank" rel="noopener noreferrer">{h.filePath.split('/').pop()}</a>
              <span className="ml-2 text-xs text-gray-500">exp. {new Date(h.expiresAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <button className="btn btn-danger" onClick={() => onDelete(h.id)}>Supprimer</button>
          </li>
        ))}
        {habilitations.length === 0 && <li className="p-3 text-sm">Aucune habilitation.</li>}
      </ul>
    </div>
  )
}
