'use client'
import { useState } from 'react'

export default function AddUserForm() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('TECH')
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, email, password, role })
    })
    if (res.ok) {
      setMsg('Utilisateur ajouté avec succès.')
      setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('TECH')
      window.location.reload()
    } else {
      setMsg('Erreur: ' + await res.text())
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-6 items-end">
      <div>
        <label className="label">Nom</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nom complet" required/>
      </div>
      <div>
        <label className="label">Nom d'utilisateur</label>
        <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="adminX" required/>
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required/>
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
      </div>
      <div>
        <label className="label">Rôle</label>
        <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="TECH">Technicien</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </div>
      <button className="btn btn-primary">Ajouter</button>
      {msg && <p className="text-sm col-span-6">{msg}</p>}
    </form>
  )
}
