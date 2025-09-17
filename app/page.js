'use client'
import { signIn, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Logo from '../components/logo'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.href = '/scan'
    }
  }, [status])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password
    })
    if (res?.ok) {
      window.location.href = '/scan'
    } else {
      setError('Identifiants invalides.')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-center gap-3">
        <Logo subtitle="Connexion" />
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label">Nom d'utilisateur</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Entrez votre nom d'utilisateur" required />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-success w-full" type="submit">Se connecter</button>
        <p className="text-xs text-gray-500">Accès réservé aux utilisateurs ENGEL.</p>
      </form>
    </div>
  )
}
