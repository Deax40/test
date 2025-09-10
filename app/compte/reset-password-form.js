'use client'
import { useState } from 'react'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      setMsg('Mot de passe mis à jour.')
      setPassword('')
    } else {
      setMsg('Erreur: ' + await res.text())
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        type="password"
        className="input"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={e=>setPassword(e.target.value)}
        required
      />
      <button className="btn btn-success">Réinitialiser</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  )
}
