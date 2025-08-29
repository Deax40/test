'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Logo from '../components/logo'

export default function TechLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', {
      redirect: false,
      username, password, role: 'TECH'
    })
    if (res?.ok) {
      window.location.href = '/tech'
    } else {
      setError('Identifiants invalides.')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-center gap-3">
        <Logo subtitle="Espace Technicien" />
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Nom d'utilisateur</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="tech01" required />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">Se connecter</button>
        <p className="text-xs text-gray-500">Accès réservé aux techniciens ENGEL.</p>
      </form>
    </div>
  )
}
