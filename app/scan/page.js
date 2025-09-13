'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Nav from '../../components/nav'
import { COMMUN_TOOLS } from '@/lib/commun-tools'

function getParisDateTime() {
  return new Date()
    .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
    .replace(' ', 'T')
    .slice(0, 16)
}

export default function ScanPage() {
  const { status, data: session } = useSession()
  const [qrData, setQrData] = useState('')
  const [tool, setTool] = useState(null)
  const [lieu, setLieu] = useState('')
  const [date, setDate] = useState(() => getParisDateTime())
  const [actorName, setActorName] = useState('')
  const [etat, setEtat] = useState('RAS')
  const [probleme, setProbleme] = useState('')
  const [photo, setPhoto] = useState(null)
  const [message, setMessage] = useState('')
  const [lastScan, setLastScan] = useState('')
  const allowedQRs = COMMUN_TOOLS

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  useEffect(() => {
    // reset any stored data at load
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        if (window.indexedDB?.databases) {
          window.indexedDB.databases().then(dbs => dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name)))
        }
      }
    } catch (e) {
      console.error(e)
    }
    setQrData('')
    setTool(null)
    setLieu('')
    setEtat('RAS')
    setProbleme('')
    setPhoto(null)
    setDate(getParisDateTime())
    setMessage('')
    setLastScan('')
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
    if (status === 'authenticated') {
      setActorName(session?.user?.name || session?.user?.username || '')
    }
  }, [status, session])

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    const formData = new FormData()
    formData.append('qrData', qrData)
    formData.append('lieu', lieu)
    formData.append('date', date)
    formData.append('actorName', actorName)
    formData.append('etat', etat)
    if (etat === 'PROBLEME') {
      formData.append('probleme', probleme)
    }
    if (photo) formData.append('photo', photo)
    const res = await fetch('/api/logs', {
      method: 'POST',
      body: formData
    })
    if (res.ok) {
      setMessage('Enregistré ✅')
      setQrData('')
      setTool(null)
      setLieu('')
      setEtat('RAS')
      setProbleme('')
      setPhoto(null)
      setDate(getParisDateTime())
    } else {
      const t = await res.text()
      setMessage('Erreur: ' + t)
    }
  }

  return (
    <div>
      <Nav active="scan" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scanner un QR code</h2>
          <div className="rounded-xl overflow-hidden bg-gray-100">
            <Scanner
              onScan={async (result) => {
                if (!result) return
                const text = Array.isArray(result)
                  ? (result[0]?.rawValue || result[0]?.text)
                  : (result?.rawValue || result?.text || String(result))
                if (!text) return
                const trimmed = text.trim()
                if (!trimmed) return
                const lower = trimmed.toLowerCase()
                let match = allowedQRs.find(
                  q => q.name === trimmed || q.hash === lower
                )
                if (!match) {
                  const hashed = await sha256Hex(trimmed)
                  match = allowedQRs.find(q => q.hash === hashed)
                }
                if (match) {
                  if (match.hash === lastScan) return
                  setLastScan(match.hash)
                  setQrData(match.hash)
                  setTool({ name: match.name })
                  setDate(getParisDateTime())
                  setMessage('')
                } else {
                  setQrData('')
                  setTool(null)
                  setMessage('QR code invalide')
                }
              }}
              onError={(err) => setMessage('Erreur caméra : ' + (err?.message || err))}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Autorisez l'accès à la caméra.</p>
        </div>
        {tool && (
          <form onSubmit={submit} className="card space-y-4">
            <h2 className="text-lg font-semibold">Détails</h2>
            <div>
              <label className="label">Équipement</label>
              <input className="input bg-gray-100 text-gray-500" value={tool.name} readOnly />
            </div>
            <div>
              <label className="label">Lieu</label>
              <input
                className="input"
                value={lieu}
                onChange={e => setLieu(e.target.value)}
                placeholder="Entrepôt A, allée 3"
                required
              />
            </div>
            <div>
              <label className="label">État</label>
              <select className="input" value={etat} onChange={e => setEtat(e.target.value)}>
                <option value="RAS">RAS</option>
                <option value="PROBLEME">Problème</option>
              </select>
            </div>
            <div>
              <label className="label">Date & heure</label>
              <input
                className="input bg-gray-100 text-gray-500"
                type="datetime-local"
                value={date}
                readOnly
              />
            </div>
            {etat === 'PROBLEME' && (
              <>
                <div>
                  <label className="label">Description du problème</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={probleme}
                    onChange={e => setProbleme(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Photo</label>
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={e => setPhoto(e.target.files[0] || null)}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="label">Qui le fait</label>
              <input className="input bg-gray-100 text-gray-500" value={actorName} readOnly />
            </div>
            <button className="btn btn-success w-full">Enregistrer</button>
          </form>
        )}
      </div>
      {message && (
        <p
          className={`mt-4 text-center ${
            message.includes('Enregistré') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
