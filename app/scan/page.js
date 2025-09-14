'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), { ssr: false })

export default function ScanPage() {
  const [token, setToken] = useState(null)
  const [tool, setTool] = useState(null)
  const [form, setForm] = useState({ name: '', location: '', state: '', user: '', weight: '', imoNumber: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/session')
        if (res.status === 401) {
          window.location.href = '/'
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (e) {
        setError(e.message)
      }
    }
    loadSession()
  }, [])

  function handleScan(result) {
    if (!result) return
    const text = Array.isArray(result)
      ? result[0]?.rawValue || result[0]?.text
      : result?.rawValue || result?.text || String(result)
    if (!text) return
    startScan(text.trim().toLowerCase())
  }

  async function startScan(hash) {
    hash = hash.trim().toLowerCase()
    setError('')
    setMessage('')
    setToken(null)
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, scannedBy: (user?.email || '').trim() }),
      })
      if (res.status === 404) {
        setTool(null)
        setError('Outil introuvable')
        return
      }
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      setTool(data.tool)
      setForm({
        name: data.tool.name || '',
        location: data.tool.location || '',
        state: data.tool.state || '',
        user: data.tool.lastScanBy || '',
        weight: data.tool.weight || '',
        imoNumber: data.tool.imoNumber || '',
      })
      setToken(data.editSessionToken)
    } catch (e) {
      setError(e.message)
    }
  }

  async function save() {
    if (!token || !tool) return
    setError('')
    setMessage('')
    try {
      const res = await fetch(`/api/tools/${tool.hash}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (res.status === 403) {
        setError('Session expirée — veuillez rescanner.')
        setToken(null)
        return
      }
      if (!res.ok) throw new Error('Sauvegarde échouée')
      const data = await res.json()
      setTool(data.tool)
      setToken(data.editSessionToken)
      setMessage('Mise à jour enregistrée.')
    } catch (e) {
      setError(e.message)
    }
  }

  const disabled = !token

  return (
    <div>
      <Nav active="scan" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scanner un outil</h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <Scanner onScan={handleScan} onError={err => setError('Erreur caméra : ' + (err?.message || err))} />
          </div>
        </div>
        <div className="card space-y-4">
          {error && <p className="text-red-600">{error}</p>}
          {tool && (
            <>
              <h2 className="text-lg font-semibold">{tool.name}</h2>
              <div>
                <label className="label">Nom</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} readOnly={disabled} />
              </div>
              <div>
                <label className="label">Lieu</label>
                <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} readOnly={disabled} />
              </div>
              <div>
                <label className="label">État</label>
                <input className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} readOnly={disabled} />
              </div>
              <div>
                <label className="label">Dernier scan</label>
                <p>{tool.lastScanAt || '-'}</p>
              </div>
              <div>
                <label className="label">Utilisateur</label>
                <input className="input" value={form.user} onChange={e => setForm({ ...form, user: e.target.value })} readOnly={disabled} />
              </div>
              <div>
                <label className="label">Poids</label>
                <input className="input" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} readOnly={disabled} />
              </div>
              <div>
                <label className="label">Numéro IMO</label>
                <input className="input" value={form.imoNumber} onChange={e => setForm({ ...form, imoNumber: e.target.value })} readOnly={disabled} />
              </div>
              <button className="btn btn-success w-full" onClick={save} disabled={disabled}>Enregistrer</button>
              {message && <p className="text-green-600">{message}</p>}
            </>
          )}
          {!tool && <p>Aucun outil chargé.</p>}
        </div>
      </div>
    </div>
  )
}
