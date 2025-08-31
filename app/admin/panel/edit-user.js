'use client'
import { useState } from 'react'

export default function EditUserForm({ user }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name || '')
  const [username, setUsername] = useState(user.username || '')
  const [email, setEmail] = useState(user.email || '')
  const [role, setRole] = useState(user.role)
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, role, password })
    })
    if (res.ok) {
      setEditing(false)
      window.location.reload()
    } else {
      setMsg('Erreur: ' + await res.text())
    }
  }

  if (!editing) {
    return <button className="btn mr-2" onClick={() => setEditing(true)}>Modifier</button>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 mr-2 text-left">
      <div>
        <label className="label">Nom</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
      </div>
      <div>
        <label className="label">Nom d'utilisateur</label>
        <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label">Mot de passe (laisser vide pour ne pas changer)</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      </div>
      <div>
        <label className="label">Rôle</label>
        <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="TECH">Technicien</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="flex gap-2">
        <button className="btn btn-success">Enregistrer</button>
        <button type="button" className="btn" onClick={() => setEditing(false)}>Annuler</button>
      </div>
    </form>
  )
}
