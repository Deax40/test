'use client'
import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function TechPage() {
  const { data: session, status } = useSession()
  const [qrData, setQrData] = useState('')
  const [lieu, setLieu] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,16))
  const [actorName, setActorName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, lieu, date, actorName })
    })
    if (res.ok) {
      setMessage('Enregistré ✅')
      setQrData('')
      setLieu('')
      setActorName('')
      setDate(new Date().toISOString().slice(0,16))
    } else {
      const t = await res.text()
      setMessage('Erreur: ' + t)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scanner un QR code</h2>
          <button className="btn" onClick={() => signOut({ callbackUrl: '/' })}>Se déconnecter</button>
        </div>
        <div className="rounded-xl overflow-hidden bg-gray-100">
          <Scanner
            onScan={(result) => {
              if (!result) return;
              const text = Array.isArray(result)
                ? (result[0]?.rawValue || result[0]?.text)
                : (result?.rawValue || result?.text || String(result));
              if (text) setQrData(text);
            }}
            onError={(err) => console.error(err)}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Autorisez l'accès à la caméra. Si besoin, vous pouvez aussi coller manuellement la donnée scannée ci-dessous.</p>
      </div>
      <form onSubmit={submit} className="card space-y-4">
        <h2 className="text-lg font-semibold">Détails</h2>
        <div>
          <label className="label">Donnée QR</label>
          <textarea className="input" rows={3} value={qrData} onChange={e=>setQrData(e.target.value)} placeholder="Contenu du QR code" required/>
        </div>
        <div>
          <label className="label">Lieu</label>
          <input className="input" value={lieu} onChange={e=>setLieu(e.target.value)} placeholder="Entrepôt A, allée 3" required/>
        </div>
        <div>
          <label className="label">Date & heure</label>
          <input className="input" type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required/>
        </div>
        <div>
          <label className="label">Qui le fait</label>
          <input className="input" value={actorName} onChange={e=>setActorName(e.target.value)} placeholder="Nom du technicien" required/>
        </div>
        {message && <p className={`text-sm ${message.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <button className="btn btn-primary w-full">Enregistrer</button>
      </form>
    </div>
  )
}
