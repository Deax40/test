'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), { ssr: false })

export default function ScanPage() {
  const [token, setToken] = useState(null)
  const [tool, setTool] = useState(null)
  const [form, setForm] = useState({
    contact: '',
    weight: '',
    date: '',
    lastUser: '',
    dimensions: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [scanning, setScanning] = useState(false)

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

  useEffect(() => {
    if (!user?.name || !tool) return
    setForm(prev => (prev.lastUser ? prev : { ...prev, lastUser: user.name }))
  }, [user, tool])

  function handleScan(result) {
    if (!result) return
    const text = Array.isArray(result)
      ? result[0]?.rawValue || result[0]?.text
      : result?.rawValue || result?.text || String(result)
    if (!text) return
    startScan(text)
  }

  async function startScan(raw) {
    const payload = String(raw).trim()
    if (!payload) return
    if (!/^[a-f0-9]{64}$/i.test(payload)) {
      setError('QR code non reconnu')
      return
    }
    setError('')
    setMessage('')
    setToken(null)
    try {
      setScanning(true)
      const body = {
        hash: payload.toLowerCase(),
      }
      if (user?.name) {
        body.scannedBy = user.name
      }
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        window.location.href = '/'
        return
      }
      if (res.status === 404) {
        setTool(null)
        setError('QR code non reconnu')
        return
      }
      if (!res.ok) throw new Error('Scan failed')
      const data = await res.json()
      setTool(data.tool)
      setForm({
        contact: data.tool.contact || '',
        weight: data.tool.weight || '',
        date: data.tool.date || '',
        lastUser: data.tool.lastUser || user?.name || '',
        dimensions: data.tool.dimensions || '',
      })
      setToken(data.editSessionToken)
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
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
      setForm({
        contact: data.tool.contact || '',
        weight: data.tool.weight || '',
        date: data.tool.date || '',
        lastUser: data.tool.lastUser || '',
        dimensions: data.tool.dimensions || '',
      })
      setToken(data.editSessionToken)
      setMessage('Modifications enregistrées.')
    } catch (e) {
      setError(e.message)
    }
  }

  const canEdit = user?.role === 'TECH' || user?.role === 'ADMIN'
  const disabled = !token || !canEdit

  return (
    <div>
      <Nav active="scan" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scanner un outil</h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <Scanner onScan={handleScan} onError={err => setError('Erreur caméra : ' + (err?.message || err))} />
          </div>
          {scanning && <p className="mt-2 text-sm text-gray-500">Validation du QR code…</p>}
        </div>
        <div className="card space-y-4">
          {error && <p className="text-red-600">{error}</p>}
          {tool && (
            <>
              <h2 className="text-lg font-semibold">{tool.name}</h2>
              <div>
                <label className="label">Numéro ou e-mail</label>
                <input
                  className="input"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  readOnly={disabled}
                />
              </div>
              <div>
                <label className="label">Poids</label>
                <input
                  className="input"
                  value={form.weight}
                  onChange={e => setForm({ ...form, weight: e.target.value })}
                  readOnly={disabled}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="input"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  readOnly={disabled}
                />
              </div>
              <div>
                <label className="label">Dernière personne</label>
                <input
                  className="input"
                  value={form.lastUser}
                  onChange={e => setForm({ ...form, lastUser: e.target.value })}
                  readOnly={disabled}
                />
              </div>
              <div>
                <label className="label">Dimensions</label>
                <textarea
                  className="input min-h-[6rem]"
                  value={form.dimensions}
                  onChange={e => setForm({ ...form, dimensions: e.target.value })}
                  readOnly={disabled}
                />
              </div>
              <button className="btn btn-success w-full" onClick={save} disabled={disabled}>Valider</button>
              {message && <p className="text-green-600">{message}</p>}
            </>
          )}
          {!tool && <p>Aucun outil chargé.</p>}
        </div>
      </div>
    </div>
  )
}
