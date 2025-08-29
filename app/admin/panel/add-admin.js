'use client'
import { useState } from 'react'

export default function AddAdminForm() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password })
    })
    if (res.ok) {
      setMsg('Admin ajouté.')
      setName(''); setUsername(''); setPassword('')
      window.location.reload()
    } else {
      setMsg('Erreur: ' + await res.text())
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4 items-end">
      <div>
        <label className="label">Nom</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nom complet" required />
      </div>
      <div>
        <label className="label">Nom d'utilisateur</label>
        <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="adminX" required />
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
      </div>
      <button className="btn btn-primary">Ajouter</button>
      {msg && <p className="text-sm col-span-4">{msg}</p>}
    </form>
  )
}
