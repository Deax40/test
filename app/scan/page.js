'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Scanner } from '@yudiel/react-qr-scanner'
import Nav from '../../components/nav'

export default function ScanPage() {
  const { status } = useSession()
  const [qrData, setQrData] = useState('')
  const [lieu, setLieu] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,16))
  const [actorName, setActorName] = useState('')
  const [etat, setEtat] = useState('CORRECT')
  const [photo, setPhoto] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/'
    }
  }, [status])

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    const formData = new FormData()
    formData.append('qrData', qrData)
    formData.append('lieu', lieu)
    formData.append('date', date)
    formData.append('actorName', actorName)
    formData.append('etat', etat)
    if (photo) formData.append('photo', photo)
    const res = await fetch('/api/logs', {
      method: 'POST',
      body: formData
    })
    if (res.ok) {
      setMessage('Enregistré ✅')
      setQrData('')
      setLieu('')
      setActorName('')
      setEtat('CORRECT')
      setPhoto(null)
      setDate(new Date().toISOString().slice(0,16))
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
              onScan={(result) => {
                if (!result) return
                const text = Array.isArray(result)
                  ? (result[0]?.rawValue || result[0]?.text)
                  : (result?.rawValue || result?.text || String(result))
                if (text) setQrData(text)
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
            <label className="label">État</label>
            <select className="input" value={etat} onChange={e=>setEtat(e.target.value)}>
              <option value="CORRECT">État correct</option>
              <option value="ENDOMMAGE">État endommagé</option>
            </select>
          </div>
          {etat === 'ENDOMMAGE' && (
            <div>
              <label className="label">Photo</label>
              <input className="input" type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0] || null)} required/>
            </div>
          )}
          <div>
            <label className="label">Qui le fait</label>
            <input className="input" value={actorName} onChange={e=>setActorName(e.target.value)} placeholder="Nom du technicien" required/>
          </div>
          {message && <p className={`text-sm ${message.startsWith('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          <button className="btn btn-primary w-full">Enregistrer</button>
        </form>
      </div>
    </div>
  )
}
