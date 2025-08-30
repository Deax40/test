'use client'
import { useState } from 'react'

const statuses = [
  'ENVOI MATERIEL',
  'RECEPTION MATERIEL',
  'DEPOT BUREAU PARIS',
  'SORTIE BUREAU PARIS',
  'DEPOT BUREAU GLEIZE',
  'SORTIE BUREAU GLEIZE',
  'AUTRES',
  'CHEZ CLIENT'
]

export default function ToolForm({ tool }) {
  const [status, setStatus] = useState('')
  const [form, setForm] = useState({
    lieu: '',
    client: '',
    etat: '',
    transporteur: '',
    tracking: ''
  })
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = new FormData()
      data.append('tool', tool)
      data.append('status', status)
      data.append('lieu', form.lieu)
      data.append('client', form.client)
      data.append('etat', form.etat)
      data.append('transporteur', form.transporteur)
      data.append('tracking', form.tracking)
      const res = await fetch('/api/tool-logs', { method: 'POST', body: data })
      if (res.ok) {
        setStatus('')
        setForm({ lieu: '', client: '', etat: '', transporteur: '', tracking: '' })
        alert('Enregistrement effectué')
      } else {
        alert('Erreur lors de l\'enregistrement')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card mt-4 space-y-4" onSubmit={handleSubmit}>
      <h3 className="font-semibold">{tool}</h3>
      <div>
        <label className="label">Status</label>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} required>
          <option value="">Sélectionner...</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {status === 'ENVOI MATERIEL' && (
        <>
          <div>
            <label className="label">Lieu d’envoi</label>
            <input className="input" name="lieu" value={form.lieu} onChange={update} />
          </div>
          <div>
            <label className="label">Client</label>
            <input className="input" name="client" value={form.client} onChange={update} />
          </div>
          <div>
            <label className="label">État du matériel</label>
            <textarea className="input" name="etat" value={form.etat} onChange={update} rows={3} />
          </div>
          <div>
            <label className="label">Transporteur</label>
            <input className="input" name="transporteur" value={form.transporteur} onChange={update} />
          </div>
          <div>
            <label className="label">Tracking Number</label>
            <input className="input" name="tracking" value={form.tracking} onChange={update} />
          </div>
        </>
      )}

      {status === 'RECEPTION MATERIEL' && (
        <>
          <div>
            <label className="label">Client</label>
            <input className="input" name="client" value={form.client} onChange={update} />
          </div>
          <div>
            <label className="label">État du matériel</label>
            <textarea className="input" name="etat" value={form.etat} onChange={update} rows={3} />
          </div>
        </>
      )}

      {status && status !== 'ENVOI MATERIEL' && status !== 'RECEPTION MATERIEL' && (
        <>
          <div>
            <label className="label">Client</label>
            <input className="input" name="client" value={form.client} onChange={update} />
          </div>
          <div>
            <label className="label">État du matériel</label>
            <textarea className="input" name="etat" value={form.etat} onChange={update} rows={3} />
          </div>
        </>
      )}

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  )
}
