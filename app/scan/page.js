'use client'

import { useEffect, useState } from 'react'
 codex/fix-update-issue-for-tool-in-commun-rp4pps
import dynamic from 'next/dynamic'
import Nav from '@/components/nav'

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(m => m.Scanner), { ssr: false })

import { Scanner } from '@yudiel/react-qr-scanner'
import Nav from '@/components/nav'
 main

function buildDiff(before, after) {
  const diff = {}
  for (const key of ['site', 'status', 'holder', 'notes']) {
    if ((after[key] ?? '') !== (before?.[key] ?? '')) {
      diff[key] = [before?.[key] ?? '', after[key] ?? '']
    }
  }
  return diff
}

export default function ScanPage() {
  const [hash, setHash] = useState('')
  const [tool, setTool] = useState(null)
  const [form, setForm] = useState({ site: '', status: '', holder: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
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

  async function fetchTool(h) {
    setLoading(true)
    setError(null)
    setMessage('')
    try {
      const res = await fetch(`/api/tools/${h}`)
      if (res.status === 404) {
        setTool(null)
        setError('Outil introuvable pour ce hash')
        return
      }
      if (!res.ok) throw new Error(`GET tools failed: ${res.status}`)
      const data = await res.json()
      setTool(data)
      setForm({
        site: data.site || '',
        status: data.status || '',
        holder: data.holder || '',
        notes: data.notes || ''
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleScan(result) {
    if (!result) return
    const text = Array.isArray(result)
      ? result[0]?.rawValue || result[0]?.text
      : result?.rawValue || result?.text || String(result)
    if (!text) return
    const h = text.trim()
    setHash(h)
    fetchTool(h)
  }

  async function onSave() {
    if (!tool) return
    const diff = buildDiff(tool, form)
    const patchBody = {}
    Object.keys(diff).forEach(k => {
      patchBody[k] = diff[k][1]
    })
    try {
      if (Object.keys(patchBody).length) {
        const p = await fetch(`/api/tools/${tool.hash}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody)
        })
        if (!p.ok) throw new Error(`PATCH failed: ${p.status}`)
        const updated = await p.json()
        setTool(updated)
      }
      await fetch(`/api/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash: tool.hash,
          name: tool.name,
          scannedBy: user?.email || '',
          changes: Object.keys(diff).length ? diff : undefined,
          scannedAt: new Date().toISOString()
        })
      })
      setMessage('Scan enregistré (COMMUN mis à jour).')
    } catch (e) {
      setError(e.message)
    }
  }

  const canEdit = ['TECH', 'ADMIN'].includes(user?.role)

  return (
    <div>
      <Nav active="scan" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scanner un outil</h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <Scanner onScan={handleScan} onError={err => setError('Erreur caméra : ' + (err?.message || err))} />
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Hash de l'outil"
              value={hash}
              onChange={e => setHash(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                if (hash) {
                  fetchTool(hash)
                }
              }}
            >
              Charger
            </button>
          </div>
        </div>
        <div className="card space-y-4">
          {loading && <p>Chargement...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {tool && !loading && !error && (
            <>
              <h2 className="text-lg font-semibold">{tool.name}</h2>
              <p className="text-sm text-gray-600">{user?.name} ({user?.email})</p>
              <div>
                <label className="label">Site</label>
                <input
                  className="input"
                  value={form.site}
                  onChange={e => setForm({ ...form, site: e.target.value })}
                  readOnly={!canEdit}
                />
              </div>
              <div>
                <label className="label">Statut</label>
                <input
                  className="input"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  readOnly={!canEdit}
                />
              </div>
              <div>
                <label className="label">Détenteur</label>
                <input
                  className="input"
                  value={form.holder}
                  onChange={e => setForm({ ...form, holder: e.target.value })}
                  readOnly={!canEdit}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  readOnly={!canEdit}
                />
              </div>
              <p className="text-sm text-gray-500">
                Dernière mise à jour: {tool.updatedAt}
              </p>
              <button
                className="btn btn-success w-full"
                onClick={onSave}
                disabled={!canEdit}
              >
                Enregistrer
              </button>
              {message && <p className="text-green-600">{message}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
